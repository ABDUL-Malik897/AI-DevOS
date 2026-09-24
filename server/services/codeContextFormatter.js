const MAX_CODE_CONTEXT_CHARS = 30000;

const formatCodeContext = (results = []) => {

    const sortedResults = [...results].sort((a, b) => {
        if (Boolean(a.dependencyMatch) !== Boolean(b.dependencyMatch)) {
            return a.dependencyMatch ? 1 : -1;
        }
        return ((b.score || 0) - (a.score || 0));
        }
    );
    if (!Array.isArray(results) || results.length === 0) {
        return "";
    }

    let codeContext = "";

    for (let index = 0;index < sortedResults.length; index++) {
        const result = sortedResults[index];
        const contextType = result.dependencyMatch ? "DEPENDENCY CONTEXT" : "SEMANTIC MATCH";
        let relationship = "";
        if (result.dependencyMatch) {
            if (result.dependencyDirection === "imports") {
                relationship = "RELATIONSHIP: The matched file imports this file.";
            } else if (result.dependencyDirection === "imported-by") {
                relationship = "RELATIONSHIP: This file imports the matched file.";
            }
        }

        const contextPart = `
            SOURCE ${index + 1}
            TYPE: ${contextType}
            FILE: ${result.filePath}
            LINES: ${result.startLine}-${result.endLine}
            ${relationship}
            ${result.content}
        `.trim();

        const separator = codeContext.length > 0 ? "\n\n-------------------------\n\n" : "";
        const nextContext = codeContext + separator + contextPart;
        if (nextContext.length > MAX_CODE_CONTEXT_CHARS) {
            break;
        }
        codeContext = nextContext;
    }
    return codeContext;
};

module.exports = {
    formatCodeContext,
    MAX_CODE_CONTEXT_CHARS
};