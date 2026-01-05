export type TColumnType =
    | "int"
    | "float"
    | "bool"
    | "string"
    | "[]"
    | "string[]"
    | "int[]"
    | "float[]"
    | "enum"
    // table -> row[]
    | `@${string}`;
