function objectLiteralToString(obj, indent = '  ') {
  let str = '{\n';
  const keys = Object.keys(obj);
  keys.forEach((key, index) => {
    str += `${indent}${key}: `;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      str += objectLiteralToString(obj[key], indent + '  ');
    } else {
      str += JSON.stringify(obj[key]);
    }
    if (index < keys.length - 1) {
      str += ',';
    }
    str += '\n';
  });
  str += `${indent.slice(0, -2)}}`;
  return str;
}

export function schemaTemplate() {
  return `export default {}`;
}