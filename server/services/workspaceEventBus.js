const clients = new Map();

const subscribe = (projectId, response) => {
    const key = String(projectId);

    if (!clients.has(key)) {
        clients.set(key, new Set());
    }

    clients.get(key).add(response);

    return () => {
        const projectClients = clients.get(key);

        if (!projectClients) {
            return;
        }

        projectClients.delete(response);

        if (projectClients.size === 0) {
            clients.delete(key);
        }
    };
};

const publish = (projectId, event) => {
    const projectClients = clients.get(String(projectId));
    console.log(
        "WORKSPACE EVENT BUS:",
        String(projectId),
        "clients:",
        projectClients?.size || 0,
        "event:",
        event
    );

    if (!projectClients) {
        return;
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`;

    for (const response of projectClients) {
        try {
            response.write(payload);
        } catch (error) {
            projectClients.delete(response);
        }
    }
};

module.exports = {
    subscribe,
    publish,
};