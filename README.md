# Getting Started with API-CLI
This project is for creating API endpoint and schema files through the command line. 
One can customize the directory accordingly to where the files will be created. This CLI currently will create the files in the /routes directory (in the root) and when a user inputs a specific route will create corresponding files under the directory. For instance, if the user enters 'member' for directory when prompted, the files will be created under /routes/member. 
The API-CLI is built for the directory to follow the routing of the API for best practices.

### How to run
Users can run `apicli` to see a little introduction of the cli. The command `apicli --help` will show an overview of what the cli is capable of.

### Commands
There are currently two commands: `apicli create` and `apicli json`. 
To create an API-endpoint file, user will type in `apicli create` and prompted to the following prompts to create an API endpoint:
1. User will be prompted to enter the route for the API endpoint. 
2. User will be prompted to select a RESTful method. If the selected method already exists in the given route, the CLI will exit. 
3. Depending on method (if not `GET` or `DELETE`) and if the schema files don't exist user will be asked if they would like to create the schema files (`response.schema.js` & `body.schema.js`).
4. If the schema files exist but the user will like to create one they will have the option to do so. The new response files will be named http-method.response.schema.js, for instance, when the user selects `post`, the file name will be either post.response.schema.js \ post.body.schema.js. This is to prevent duplicate files and customizations could be further made on the index.js file. The import of the response schema file will be automatically setup to reflect the correct response file.

To create an JSON schema from a JSON object user will type in `apicli json`. The user will type in the json object they want to convert to a schema. It will able to discern objects and arrays within the given json schema. For date and date-time it will return the type to be "string" with format being either "date" or "date-time". It is currently capable of deeply nested JSON objects as well. Once the JSON schema is generated, the user can paste it to either the `response.schema.js` or `body.schema.js` file that was created from the previous steps. The JSON format currently follows the [JSON to JSON Schema Converter](https://www.liquid-technologies.com/online-json-to-schema-converter).

### Customization
The files are meant to trigger errors when first created by the CLI. Users will have to further customize the endpoint file where the `@` is at which includes responseSchema, config permission, and Handler. The schema files and endpoint files for detailed coding is defaulted to be empty as the CLI will be more of providing the structure for initial building of the API endpoint.  

### NPM Package
This CLI is a npm package and could be installed as a dependency in any repository. 
Currently the API endpoint template is built to assist [Fastify-CLI](https://www.npmjs.com/package/fastify-cli). Further customization on the template for API endpoint and schema files can be made on `template.mjs` and `schemaTemplate.mjs`. The routing or directory configuration can be made further as well. 

### Default Endpoint Template
```
import responseSchema from './response.schema.js';

/**  @type {import('fastify').FastifyPluginAsync} */
export default async function (fastify) {
  fastify.get('/routeName', {
    schema: {
      response: {
        200: responseSchema
      }
    },
    handler: @
  })
}


/** @type {import('fastify').RouteHandlerMethod} */
async function @Handler(request, reply) {
  throw {status: 501, message: 'Not implemented'}
}
```

### Default Schema Template
`
export default {
  "type": "object",
  "properties": {}
}
`
