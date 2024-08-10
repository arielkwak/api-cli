#!/usr/bin/env node
import figlet from "figlet";
import chalk from "chalk";
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import template from './template.mjs';
import { schemaTemplate } from './schemaTemplate.mjs';
import inquirer from 'inquirer';

const program = new Command();

function ensureDirSync(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

function generateSchema(jsonObject) {
  const schema = { type: 'object', properties: {} };

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)?$/;

  for (const key in jsonObject) {
    const value = jsonObject[key];
    if (typeof value === 'string') {
      if (dateRegex.test(value)) {
        schema.properties[key] = { type: 'string', format: 'date' };
      } else if (dateTimeRegex.test(value)) {
        schema.properties[key] = { type: 'string', format: 'date-time' };
      } else {
        schema.properties[key] = { type: 'string' };
      }
    } else if (typeof value === 'number') {
      schema.properties[key] = { type: 'integer' };
    } else if (typeof value === 'boolean') {
      schema.properties[key] = { type: 'boolean' };
    } else if (Array.isArray(value)) {
      if (typeof value[0] === 'object' && value[0] !== null) {
        schema.properties[key] = { type: 'array', items: generateSchema(value[0]) };
      } else {
        schema.properties[key] = { type: 'array', items: { type: typeof value[0] } };
      }
    } else if (typeof value === 'object' && value !== null) {
      schema.properties[key] = generateSchema(value);
    }
  }

  return schema;
}

process.on('uncaughtException', function(err) {
  if (err.name === 'ExitPromptError') {
    console.log(chalk.blueBright('Exiting CLI... See you next time!👋'));
    process.exit();
  } else {
    console.error('An unexpected error occurred:', err);
    process.exit(1); 
  }
});

// Declare program name and description
program
  .name('api-cli')
  .description('CLI to create API endpoint files.')
  .version('1.0.0')
  .action((str) => {
    figlet('api-cli', 'serifcap', function (err, data) {
        if (err) {
            console.log("Something went wrong...");
            console.dir(err);
            return;
        }
        console.log(chalk.bold.magenta(data));
        console.log('\n');
        console.log(chalk.bgMagenta('CLI to create API endpoint files.')); 
    });
  });

// Create files (api enpoint & schema) for given route
program
  .command('create')
  .description('Create an API endpoint route')
  .action(async () => {
    // prompt the user for the route and method 
    const {route, method} = await inquirer.prompt([
      {
        type: 'input',
        name: 'route',
        message: 'Enter the route for the API endpoint',
        validate: function(input) {
          if (!input.startsWith('/')) {
            return 'Invalid route. Please start the route with a "/". For example, use "/members" instead of "members".';
          }
          if (input.includes('/_')) {
            return 'Invalid route. Please use ":" instead of "_" for route parameters. For example, use "/:memberId" instead of "/_memberId".';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'method',
        message: 'Select the method for the API endpoint',
        choices: ['get', 'post', 'put', 'delete', 'patch']
      }
    ])

    // Replace ':' with '_' in the route for the directory name
    const dirName = route.replace(/:/g, '_');

    // create the directory for the endpoint if it doesn't exist
    const dirPath = path.join(process.cwd(), 'routes', dirName); 
    ensureDirSync(dirPath);

    const filePath = path.join(dirPath, `_${method}.js`);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      console.log(chalk.red(`Error: The ${method.toUpperCase()} route already exists in /${route}`));
      return;
    }

    // for usability we will say the file has been created, the file is created towards the end bc of parameters
    console.log(chalk.green(`Created ${method.toUpperCase()} file in /${route}`));


    const responseSchemaPath = path.join(dirPath, 'response.schema.js');
    const bodySchemaPath = path.join(dirPath, 'body.schema.js');

    // check if schema files already exist in folder structure
    const bodySchemaExists = fs.existsSync(bodySchemaPath);
    const responseSchemaExists = fs.existsSync(responseSchemaPath);
    const schemaFileContent = schemaTemplate();

    let createResponseSchemaFile = true; 
    let createNewResponseFile = false;
    let newResponseFileName = `response.schema.js`;

    if(!responseSchemaExists){
      // ask the user if they want to create schema files: response.schema.js
      const response  = await inquirer.prompt({
        type: 'confirm',
        name: 'createResponseSchemaFile',
        message: 'Would you like to create the response.schema.js file? (y,n)',
        default: false
      });
      createResponseSchemaFile = response.createResponseSchemaFile;
      if (createResponseSchemaFile) {
        fs.writeFileSync(responseSchemaPath, schemaFileContent);
        console.log(chalk.green(`Created ${newResponseFileName} in /${route}`));
      }
    } else {
      const response = await inquirer.prompt({
        type: 'confirm',
        name: 'createNewResponseFile',
        message: chalk.yellow('The response.schema.js file already exists. Would you like to create an additional response schema file? (y,n)'),
        default: false
      });

      createNewResponseFile = response.createNewResponseFile;

      if(response.createNewResponseFile){
        newResponseFileName = `${method}.response.schema.js`;
        const newResponseSchemaPath = path.join(dirPath, newResponseFileName);
        fs.writeFileSync(newResponseSchemaPath, schemaFileContent);
        console.log(chalk.green(`Created ${newResponseFileName} in /${route}`));
      } else {
        console.error(chalk.bgYellow(`Skipped to create ${responseSchemaPath}`));
      }
    }

    // if either of the schema files doesn't exist ask the user if they want to create them
    let createBodySchemaFile = true; 
    let createNewBodyFile = false;
    let newBodyFileName = `body.schema.js`;

    if(!['get', 'delete'].includes(method)){
      if(!bodySchemaExists){
        // ask the user if they want to create schema files: body.schema.js 
        const response = await inquirer.prompt({
          type: 'confirm',
          name: 'createBodySchemaFile',
          message: 'Would you like to create the body.schema.js file? (y,n)',
          default: false
        });

        createBodySchemaFile = response.createBodySchemaFile;
        if(createBodySchemaFile){
          fs.writeFileSync(bodySchemaPath, schemaFileContent);
          console.log(chalk.green(`Created ${newBodyFileName} in /${route}`));
        }
      } else {
        const response = await inquirer.prompt({
          type: 'confirm',
          name: 'createNewBodyFile',
          message: chalk.yellow('The body.schema.js file already exists. Would you like to create an additional body schema file? (y,n)'),
          default: false
        });

        createNewBodyFile = response.createNewBodyFile;

        if(response.createNewBodyFile){
          newBodyFileName = `${method}.body.schema.js`;
          const newBodySchemaPath = path.join(dirPath, newBodyFileName);
          fs.writeFileSync(newBodySchemaPath, schemaFileContent);
          console.log(chalk.green(`Created ${newBodyFileName} in /${route}`));
        } else {
          console.error(chalk.bgYellow(`Skipped to create ${bodySchemaPath}`));
        }
      }
    }

    // create the endpoint file
    const fileContent = template(method, route, createResponseSchemaFile, createNewResponseFile);
    fs.writeFileSync(filePath, fileContent, { flag: 'wx' });
    // console.log(chalk.green(`Created ${method.toUpperCase()} file in /${route}`));
    
    console.log(chalk.underline.magentaBright('Please fix the @ in the generated file with the appropriate handlers & permissions.'));
    console.log(chalk.bgGreen('Happy Coding!🚀🚀🚀'));
  });

// Generate JSON schema
program
  .command('json')
  .description('Generate a JSON schema from a JSON object')
  .action(async () => {
    const { json } = await inquirer.prompt([
      {
        type: 'input',
        name: 'json',
        message: 'Enter the JSON object',
        validate: function(input) {
          try {
            JSON.parse(input.replace(/'/g, '"'));
            return true;
          } catch (error) {
            return 'Invalid JSON object. Please enter a valid JSON object. The format should be {"reporting_due_date": {"type": ["String", "Null"], "format": "date"}, "member":"hello", "id": 1}';
          }
        },
      },
    ]);
    const jsonObject = JSON.parse(json.replace(/'/g, '"'));
    const schema = generateSchema(jsonObject);
    console.log(JSON.stringify(schema, null, 2));
  })

program.parse();