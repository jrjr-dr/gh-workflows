// .github/scripts/process_yaml.js
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Recursively searches for a key in an object or array
 * @param {Object|Array} obj - The object to search in
 * @param {string} searchKey - The key to search for
 * @returns {*} The value if found, undefined otherwise
 */
function findKey(obj, searchKey) {
    if (obj === null || typeof obj !== 'object') {
        return undefined;
    }

    console.log(`Searching for key '${searchKey}' in`, obj);

    if (Object.prototype.hasOwnProperty.call(obj, searchKey)) {
        return obj[searchKey];
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findKey(item, searchKey);
            if (result !== undefined) {
                return result;
            }
        }
    } else {
        for (const key of Object.keys(obj)) {
            const result = findKey(obj[key], searchKey);
            if (result !== undefined) {
                return result;
            }
        }
    }

    return undefined;
}

/**
 * Process a multi-document YAML file and search for specific keys
 * @param {string} filePath - Path to the YAML file
 * @param {string} searchKey - Key to search for in each document
 */
function processYamlFile(filePath, searchKey) {
    try {
        // Read the file content
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Split content into documents and parse each one
        const documents = yaml.loadAll(fileContent);

        console.log(`Processing ${documents.length} YAML documents`);

        const results = [];

        documents.forEach((doc, index) => {
            const value = findKey(doc, searchKey);
            if (value !== undefined) {
                results.push({
                    document: index + 1,
                    value: value
                });
            }
        });

        // Output results in GitHub Actions format
        if (results.length > 0) {
            // Set output for GitHub Actions
            console.log(`::set-output name=found_values::${JSON.stringify(results)}`);

            // Print human-readable format
            console.log('\nProcessing Results:');
            results.forEach(result => {
                console.log(`Document ${result.document}: Found '${searchKey}' with value:`, result.value);
            });
        } else {
            console.log(`::warning::No values found for key '${searchKey}' in any YAML document`);
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`::error::File not found: ${filePath}`);
            process.exit(1);
        } else if (error instanceof yaml.YAMLException) {
            console.log(`::error::YAML parsing error: ${error.message}`);
            process.exit(1);
        } else {
            console.log(`::error::Unexpected error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Main execution
if (process.argv.length !== 4) {
    console.log('::error::Usage: node process_yaml.js <yaml_file_path> <search_key>');
    process.exit(1);
}

const [, , yamlPath, searchKey] = process.argv;
processYamlFile(yamlPath, searchKey);