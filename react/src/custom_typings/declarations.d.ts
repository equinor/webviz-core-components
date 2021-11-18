// This file contains ambient type declarations for npm modules without type declarations

declare module 'react-colorscales';
declare module "*.svg" {
    import React = require("react");
    export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}
