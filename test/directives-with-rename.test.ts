import { stitchingDirectives } from "@graphql-tools/stitching-directives";
import { stitchSchemas } from "@graphql-tools/stitch"
import { makeExecutableSchema } from "@graphql-tools/schema";
import { RenameTypes } from "@graphql-tools/wrap";
import { execute, parse } from "graphql";

const renameType = (typeName: string) => (name: string) => { return name === typeName ? "StitchedType" : name }

it("Stitching directives don't account for renamed types", async () => {
    const directives = stitchingDirectives();

    const schema = `type TypeOne {
                        id: ID!
                        fieldOne: String!
                    }

                    type Query {
                        typeOne(id: ID!): TypeOne @merge(keyField: "id")
                    }`;

    const otherSchema = `type TypeTwo {
                            id: ID!
                            fieldTwo: String!
                        }

                        type Query {
                            typeTwo(id: ID!): TypeTwo @merge(keyField: "id")
                        }`;

    const subschema = {
        schema: makeExecutableSchema({
          typeDefs: `${directives.allStitchingDirectivesTypeDefs} ${schema}`,
          resolvers: {
            Query: {
              typeOne: (_obj, args: { id: string }) => {
                return { id: args.id, fieldOne: 'one' };
              },
            },
          },
        }),
        transforms: [ new RenameTypes(renameType("TypeOne"))]
      };
  
      const otherSubschema = {
          schema: makeExecutableSchema({
            typeDefs: `${directives.allStitchingDirectivesTypeDefs} ${otherSchema}`,
            resolvers: {
                Query: {
                    typeTwo: (_obj, args: { id: string }) => {
                    return { id: args.id, fieldTwo: 'two' };
                    },
                },
            },
          }),
          transforms: [ new RenameTypes(renameType("TypeTwo"))]
        }
  
      const gatewaySchema = stitchSchemas({
        subschemas: [subschema, otherSubschema],
        subschemaConfigTransforms: [ directives.stitchingDirectivesTransformer ],
      });

      const queryDoc = parse(`query($arg: ID!){
                  typeOne(id: $arg){
                    fieldOne
                    fieldTwo
                  }
               }`);

    const result = await execute({
      schema: gatewaySchema,
      document: queryDoc,
      variableValues: {
        arg: 'someID',
      },
    });

    expect(result.data).toMatchObject({ typeOne: { fieldOne: 'one', fieldTwo: 'two' } });
});
