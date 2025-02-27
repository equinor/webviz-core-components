import React from "react";

import Paper, { PaperProps } from "@mui/material/Paper";
import Draggable from "react-draggable";

export const DraggablePaperComponent: React.FC<PaperProps> = (props) => {
    return (
        <div>
            <Draggable
                handle="#draggable-dialog-title"
                cancel={'[class*="MuiDialogContent-root"]'}
            >
                <Paper {...props} />
            </Draggable>
        </div>
    );
};
