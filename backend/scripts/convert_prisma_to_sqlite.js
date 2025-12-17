const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Find all enums
const enumRegex = /enum\s+(\w+)\s+\{([^}]+)\}/g;
let match;
const enums = [];

while ((match = enumRegex.exec(schema)) !== null) {
    enums.push(match[1]);
}

console.log(`Found enums: ${enums.join(', ')}`);

// 2. Remove all enums
schema = schema.replace(enumRegex, '');

// 3. Replace usage of enums with String
enums.forEach(enumName => {
    // Replace "fieldName EnumName" with "fieldName String"
    // Be careful with word boundaries
    const usageRegex = new RegExp(`(\\s+)${enumName}(\\[\\])?(\\??)(\\s+)`, 'g');
    schema = schema.replace(usageRegex, (match, prefix, isArray, isOptional, suffix) => {
        // e.g. " status UserStatus " -> " status String "
        // " roles Role[] " -> " roles role[] " (Role is a model, not enum, so we need to be careful not to replace models)
        // enums are gathered from the regex, so we are safe assuming enumName IS an enum.

        // Wait, if isArray is present, it's String[]
        // if isOptional is present, it's String?

        // Actually, Prisma syntax is `field Type modifiers`.
        // So `status UserStatus @default(...)`
        // We match the Type part.

        return `${prefix}String${isArray || ''}${isOptional || ''}${suffix}`;
    });
});

// 4. Remove default values that refer to enum values
// e.g. @default(ACTIVE) -> @default("ACTIVE")
// This is harder because we need to know which fields resulted from enums.
// BUT, if we just look for @default(VALUE) where VALUE is an enum member?
// Easier: Quote all @default values that look like identifiers and are not functions like now() or autoincrement().
// Regex for @default(IDENTIFIER)
// But true/false/numbers should not be quoted.

schema = schema.replace(/@default\(([A-Z_][A-Z0-9_]*)\)/g, (match, value) => {
    // If it's potentially an enum value (Assuming uppercase convention)
    // We can quote it.
    return `@default("${value}")`;
});

// 5. Cleanup mysql attributes (already done by sed but good to be sure)
schema = schema.replace(/@db\.\w+(\(.*\))?/g, '');

fs.writeFileSync(schemaPath, schema);
console.log('Schema converted to SQLite compatible format.');
