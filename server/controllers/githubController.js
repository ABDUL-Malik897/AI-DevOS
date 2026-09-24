const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

const getGithubLoginUrl = async (req, res) => {
    try {
        const state = jwt.sign(
            {
                userId: req.user._id.toString()
            },
            process.env.SECRET,
            {
                expiresIn: "10m"
            }
        );

        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            redirect_uri: process.env.GITHUB_CALLBACK_URL,
            scope: "read:user user:email repo",
            state
        });

        const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
        res.status(200).json({
            url
        });
    } catch (error) {
        res.status(500).json({
            error: "Could not start GitHub connection"
        });
    }
};

const githubCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.status(400).json({
                error: "GitHub authorization data missing"
            });
        }
        let decoded;
        try {
            decoded = jwt.verify(state, process.env.SECRET);
        } catch (error) {
            return res.status(401).json({
                error: "Invalid or expired GitHub state"
            });
        }

        const tokenResponse = await axios.post("https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL
            },
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            return res.status(400).json({
                error: "Failed to get GitHub access token"
            });
        }
        const githubUserResponse = await axios.get("https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json"
                }
            }
        );

        const githubUser = githubUserResponse.data;
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                error: "AI DevOS user not found"
            });
        }
        user.githubId = String(githubUser.id);
        user.githubUsername = githubUser.login;
        user.githubAccessToken = accessToken;
        await user.save();
        res.redirect("http://localhost:3000/dashboard?github=connected");
    } catch (error) {
        console.error("GitHub OAuth error:", error.response?.data || error.message);
        res.status(500).json({
            error: "GitHub connection failed"
        });
    }
};

const getRepositories = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }
        if (!user.githubAccessToken) {
            return res.status(400).json({
                error: "GitHub is not connected"
            });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const perPage = Math.min(30, Math.max(1, Number.parseInt(req.query.per_page, 10) || 12));
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const githubHeaders = {
            Authorization: `Bearer ${user.githubAccessToken}`,
            Accept: "application/vnd.github+json"
        };
        if (search) {
            const allRepositories = [];
            let githubPage = 1;
            const githubPerPage = 100;

            while (true) {
                const response = await axios.get("https://api.github.com/user/repos",
                    {
                        params: {
                            visibility: "all",
                            affiliation: "owner,collaborator,organization_member",
                            sort: "updated",
                            page: githubPage,
                            per_page: githubPerPage
                        },
                        headers: githubHeaders
                    }
                );

                allRepositories.push(...response.data);
                const linkHeader = response.headers.link || "";
                const hasNextPage = linkHeader.includes('rel="next"');
                if (!hasNextPage || response.data.length === 0) {
                    break;
                }
                githubPage += 1;
            }

            const filteredRepositories = allRepositories.filter((repo) => {
                    const name = (repo.name || "").toLowerCase();
                    const fullName = (repo.full_name || "").toLowerCase();
                    const description = (repo.description || "").toLowerCase();
                    const language = (repo.language || "").toLowerCase();
                    return (name.includes(search) || fullName.includes(search) || description.includes(search) || language.includes(search));
                });

            const totalRepositories = filteredRepositories.length;
            const totalPages = Math.ceil(totalRepositories / perPage);
            const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
            const startIndex = (safePage - 1) * perPage;
            const paginatedRepositories = filteredRepositories.slice(startIndex, startIndex + perPage);
            const repositories = paginatedRepositories.map((repo) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                defaultBranch: repo.default_branch,
                htmlUrl: repo.html_url,
                cloneUrl: repo.clone_url,
                language: repo.language,
                updatedAt: repo.updated_at
            }));

            return res.status(200).json({
                repositories,
                pagination: {
                    page: safePage,
                    perPage,
                    search,
                    totalPages,
                    totalRepositories,
                    hasNextPage: safePage < totalPages,
                    hasPreviousPage: safePage > 1
                }
            });
        }

        const response = await axios.get("https://api.github.com/user/repos",
            {
                params: {
                    visibility: "all",
                    affiliation: "owner,collaborator,organization_member",
                    sort: "updated",
                    page,
                    per_page: perPage
                },
                headers: githubHeaders
            }
        );

        const repositories = response.data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            defaultBranch: repo.default_branch,
            htmlUrl: repo.html_url,
            cloneUrl: repo.clone_url,
            language: repo.language,
            updatedAt: repo.updated_at
        }));

        const linkHeader = response.headers.link || "";
        const hasNextPage = linkHeader.includes('rel="next"');
        const hasPreviousPage = linkHeader.includes('rel="prev"');
        let totalPages = page;
        const lastPageMatch = linkHeader.match(/<([^>]+)>;\s*rel="last"/);
        if (lastPageMatch) {
            const lastPageUrl = new URL(lastPageMatch[1]);
            totalPages = Number.parseInt(lastPageUrl.searchParams.get("page"), 10) || page;
        }
        const totalRepositories = response.data.length === 0 ? (page - 1) * perPage : totalPages === page ? (page - 1) * perPage + response.data.length : totalPages * perPage;

        return res.status(200).json({
            repositories,
            pagination: {
                page,
                perPage,
                search,
                totalPages,
                totalRepositories,
                hasNextPage,
                hasPreviousPage
            }
        });
    } catch (error) {
        console.error("Repository fetch error:", error.response?.data || error.message);
        return res.status(500).json({
            error: "Failed to fetch GitHub repositories"
        });
    }
};

module.exports = {
    getGithubLoginUrl,
    githubCallback,
    getRepositories
};