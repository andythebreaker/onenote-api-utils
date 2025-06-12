import dotenv from 'dotenv';

// Helper function to convert environment variable to boolean
function toBoolean(value, defaultValue = null) {
    return value === undefined ? defaultValue : value.toLowerCase() === 'true';
}

// Helper function to convert environment variable to number
function toNumber(value, defaultValue = null) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
}

// Helper function to convert environment variable to string
function toString(value, defaultValue = null) {
    return value === undefined ? defaultValue : value;
}

// environment variables to load
var ENV = {};

function initEnv(envars) {
    // envars = { name: var_name, type: var_type, default: default_value } and default_value is optional

    // Load environment variables from .env file
    dotenv.config();

    // Convert environment variables to the specified type and use default value if undefined
    envars.forEach((_var) => {
        const value = process.env[_var.name];
        const _default = (_var.default === undefined) ? null : _var.default;
        switch (_var.type) {
            case 'boolean':
                ENV[_var.name] = toBoolean(value, _default);
                break;
            case 'number':
                ENV[_var.name] = toNumber(value, _default);
                break;
            case 'string':
                ENV[_var.name] = toString(value, _default);
                break;
            default:
                ENV[_var.name] = value !== undefined ? value : _default;
        }
    });
}

// Registered environment variables
const envars = [
    { name: 'DEV', type: 'boolean', default: false },
    { name: 'HTTPS', type: 'boolean', default: true },
    { name: 'PORT', type: 'number', default: 43010 },
    { name: 'SAVE_LOG', type: 'boolean', default: true },
    { name: 'MUTE_LOG', type: 'boolean', default: false },
           { name: 'USE_CACHE', type: 'boolean', default: false },
    { name: 'CACHE_FILE', type: 'string', default: 'data/cache/0-56CE32FBA64785CA!s8b94d9a4e33f42d0bac3dad4d483022c.json' },
    { name: 'ONENOTE_CLIENT_ID', type: 'string' },
    { name: 'ONENOTE_CLIENT_SECRET', type: 'string' }
];

initEnv(envars);
// console.log(ENV);

export { toBoolean, toNumber, toString };
export default ENV;
