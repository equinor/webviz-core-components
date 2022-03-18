import React from "react";

import {
    Avatar,
    Dialog,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from "@material-ui/core";

import { close, email, person, phone } from "@equinor/eds-icons";
import { Icon } from "@equinor/eds-core-react";

Icon.add({
    close,
    email,
    person,
    phone,
});

import { ContactPerson } from "../../../../shared-types/webviz-content/contact-person";

type AuthorDialogProps = {
    author: ContactPerson;
    open: boolean;
    onClose: () => void;
};

export const AuthorDialog: React.FC<AuthorDialogProps> = (
    props: AuthorDialogProps
) => {
    const { author, open, onClose } = props;

    return (
        <Dialog open={open} onClose={() => onClose()}>
            <DialogTitle className="WebvizPluginActions__AuthorDialog_Title">
                {"Author"}
                <IconButton
                    aria-label="close"
                    onClick={() => onClose()}
                    style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: "#ccc",
                    }}
                >
                    <Icon name="close" />
                </IconButton>
            </DialogTitle>
            {author && (
                <List>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar>
                                <Icon name="person" />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={author.name} />
                    </ListItem>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar>
                                <Icon name="email" />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={author.email} />
                    </ListItem>
                    <ListItem>
                        <ListItemAvatar>
                            <Avatar>
                                <Icon name="phone" />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={author.phone} />
                    </ListItem>
                </List>
            )}
        </Dialog>
    );
};
