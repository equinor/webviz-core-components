interface Window {
    dash_clientside: {
        set_props: (componentPath: Array<string | number>, props: Record<string, unknown>) => void;
    };
}

declare module "*.svg" {
    // TODO: Fix this the next time the file is edited.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    import React = require("react");
    export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}
declare module "*.png";
