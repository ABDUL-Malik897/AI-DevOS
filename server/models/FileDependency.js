const mongoose = require("mongoose");

const fileDependencySchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },

        sourceFile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true
        },

        sourcePath: {
            type: String,
            required: true
        },

        targetFile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true
        },

        targetPath: {
            type: String,
            required: true
        },

        importPath: {
            type: String,
            required: true
        },

        dependencyType: {
            type: String,
            enum: [
                "import",
                "require"
            ],
            required: true
        }
    },
    {
        timestamps: true
    }
);

fileDependencySchema.index({
    project: 1,
    sourceFile: 1,
    targetFile: 1
});

fileDependencySchema.index({
    project: 1,
    sourcePath: 1
});

fileDependencySchema.index({
    project: 1,
    targetPath: 1
});

module.exports = mongoose.model("FileDependency", fileDependencySchema);