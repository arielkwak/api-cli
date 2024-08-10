import fs from 'fs';
import path from 'path';

export default (method, route, createResponseSchema, createNewResponseFile) => {
  // Check if the response.schema.js file exists
  let responseSchemaPath = path.join(process.cwd(), 'routes', route.replace(/:/g, '_'), 'response.schema.js');
  let responseSchemaExists = fs.existsSync(responseSchemaPath);

  if (createNewResponseFile) {
    responseSchemaPath = path.join(process.cwd(), 'routes', route.replace(/:/g, '_'), `${method}.response.schema.js`);
    responseSchemaExists = fs.existsSync(responseSchemaPath);
  }

  // If the user chose to create the response.schema.js file, create it
  if (createResponseSchema && !responseSchemaExists) {
    fs.writeFileSync(responseSchemaPath, '{}');
    responseSchemaExists = true;
  }

  // Modify the template based on whether the response.schema.js file exists
  const responseSchemaImport = responseSchemaExists
    ? `import responseSchema from './${createNewResponseFile ? `${method}.response.schema.js` : 'response.schema.js'}';`
    : "// Please link to corresponding response schema (ex: import responseSchema from './response.schema.js';)";

  const responseSchemaUsage = responseSchemaExists
    ? "200: responseSchema"
    : "200: {}";

  // Extract parameters from the route
  const params = route.split('/').filter(part => part.startsWith(':')).map(part => part.slice(1));
  // Generate schema for each parameter
  const paramsSchema = params.map(param => {
    if (param.endsWith('Id')) {
      return `${param}: {\n          type: 'string',\n          format: 'id'\n        }`;
    } else {
      return `${param}:  {\n          type: 'string'\n        }`;
    }
  }).join(',\n');

  return `${responseSchemaImport}

/**  @type {import('fastify').FastifyPluginAsync} */
export default async function (fastify) {
  fastify.${method.toLowerCase()}('${route}', {
    schema: {
      params: {
        ${paramsSchema}
      },
      response: {
        ${responseSchemaUsage}
      }
    },
    config: {
      permissions: [@]
    },
    handler: @Handler
  })
}


/** @type {import('fastify').RouteHandlerMethod} */
async function @Handler(request, reply) {
  throw {status: 501, message: 'Not implemented'}
}`;
};