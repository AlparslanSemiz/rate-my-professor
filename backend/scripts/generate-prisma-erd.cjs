const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const outputPath = path.join(process.cwd(), 'ERD.md');
const schema = fs.readFileSync(schemaPath, 'utf8');

const scalarTypes = new Set([
  'String',
  'Boolean',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'DateTime',
  'Json',
  'Bytes',
]);

function stripLineComment(line) {
  return line.replace(/\/\/.*$/, '').trim();
}

function dbNameFromAttributes(text, fallback) {
  const match = text.match(/@map\("([^"]+)"\)/);
  return match ? match[1] : fallback;
}

function blockMapName(block, fallback) {
  const match = block.match(/@@map\("([^"]+)"\)/);
  return match ? match[1] : fallback;
}

function parseBlocks(keyword) {
  const blocks = [];
  const re = new RegExp(`${keyword}\\s+(\\w+)\\s*\\{([\\s\\S]*?)\\n\\}`, 'g');
  let match;

  while ((match = re.exec(schema)) !== null) {
    blocks.push({ name: match[1], body: match[2] });
  }

  return blocks;
}

const enumBlocks = parseBlocks('enum').map((block) => ({
  name: block.name,
  dbName: blockMapName(block.body, block.name),
  values: block.body
    .split('\n')
    .map(stripLineComment)
    .filter((line) => line && !line.startsWith('@@'))
    .map((line) => line.split(/\s+/)[0]),
}));

const enumNames = new Set(enumBlocks.map((block) => block.name));
const modelBlocks = parseBlocks('model');
const modelNames = new Set(modelBlocks.map((block) => block.name));
const models = modelBlocks.map((block) => {
  const lines = block.body
    .split('\n')
    .map(stripLineComment)
    .filter((line) => line && !line.startsWith('@@'));

  const fields = lines.map((line) => {
    const parts = line.split(/\s+/);
    const name = parts[0];
    const rawType = parts[1];
    const baseType = rawType.replace(/[?\[\]]/g, '');

    return {
      name,
      dbName: dbNameFromAttributes(line, name),
      type: baseType,
      isList: rawType.endsWith('[]'),
      nullable: rawType.includes('?'),
      isId: /\s@id\b/.test(line),
      isUnique: /\s@unique\b/.test(line),
      relationFields: [...line.matchAll(/fields:\s*\[([^\]]+)\]/g)].flatMap((match) =>
        match[1].split(',').map((field) => field.trim()).filter(Boolean),
      ),
      raw: line,
    };
  });

  return {
    name: block.name,
    dbName: blockMapName(block.body, block.name),
    fields,
  };
});

const nameToDbName = new Map([
  ...enumBlocks.map((block) => [block.name, block.dbName]),
  ...models.map((model) => [model.name, model.dbName]),
]);

let mermaid = '%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#e8f2ff", "primaryBorderColor": "#2563eb", "lineColor": "#475569", "fontFamily": "monospace"}}}%%\nerDiagram\n';

for (const enumBlock of enumBlocks) {
  mermaid += `\t${enumBlock.dbName} {\n`;
  for (const value of enumBlock.values) {
    mermaid += `\t\tvalue ${value}\n`;
  }
  mermaid += '\t}\n';
}

const relationships = [];

for (const model of models) {
  const objectFields = model.fields.filter((field) => modelNames.has(field.type));
  const foreignKeyNames = new Set(objectFields.flatMap((field) => field.relationFields));

  mermaid += `\t${model.dbName} {\n`;

  for (const field of model.fields) {
    if (modelNames.has(field.type) && !enumNames.has(field.type)) {
      if (!field.isList && field.relationFields.length > 0) {
        relationships.push({
          from: model.dbName,
          to: nameToDbName.get(field.type) || field.type,
          label: field.dbName,
          arrow: field.isUnique ? '||--||' : '}o--||',
        });
      }
      continue;
    }

    const markers = [];
    if (field.isId) markers.push('PK');
    if (foreignKeyNames.has(field.name)) markers.push('FK');
    if (field.nullable) markers.push('nullable');
    if (field.isUnique) markers.push('unique');

    mermaid += `\t\t${field.type} ${field.dbName}${markers.length ? ` "${markers.join(', ')}"` : ''}\n`;

    if (enumNames.has(field.type)) {
      relationships.push({
        from: model.dbName,
        to: nameToDbName.get(field.type) || field.type,
        label: `enum_${field.dbName}`,
        arrow: '}o--||',
      });
    }
  }

  mermaid += '\t}\n';
}

for (const relationship of relationships) {
  mermaid += `\t${relationship.from} ${relationship.arrow} ${relationship.to} : ${relationship.label}\n`;
}

const prismaVersion = require(path.join(process.cwd(), 'node_modules', 'prisma', 'package.json')).version;
const datasourceMode = schema.includes('url      = env(\"DATABASE_URL\")')
  ? 'schema datasource url'
  : 'prisma.config.ts datasource url';
const generatedAt = new Date().toISOString();

const markdown = [
  '# Prisma ERD',
  '',
  `Generated from \`prisma/schema.prisma\` at ${generatedAt}.`,
  '',
  `- Prisma CLI: ${prismaVersion}`,
  `- Datasource URL: ${datasourceMode}`,
  `- Models: ${models.length}`,
  `- Enums: ${enumBlocks.length}`,
  '',
  '```mermaid',
  mermaid.trimEnd(),
  '```',
  '',
].join('\n');

fs.writeFileSync(outputPath, markdown);
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
