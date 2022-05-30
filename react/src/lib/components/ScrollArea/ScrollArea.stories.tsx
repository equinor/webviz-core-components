import React from "react";

import { ComponentStory, ComponentMeta } from "@storybook/react";

import { ScrollArea, ScrollAreaProps } from "./ScrollArea";

export default {
    title: "Components/ScrollArea",
    component: ScrollArea,
} as ComponentMeta<typeof ScrollArea>;

const Template: ComponentStory<typeof ScrollArea> = (args: ScrollAreaProps) => (
    <div style={{ display: "flex", height: "300px" }}>
        <ScrollArea {...args} />
    </div>
);

export const Basic = Template.bind({});
Basic.args = {
    children: (
        <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Velit
            egestas dui id ornare. Convallis tellus id interdum velit laoreet id
            donec. Neque volutpat ac tincidunt vitae. Enim praesent elementum
            facilisis leo vel fringilla est ullamcorper. Pellentesque habitant
            morbi tristique senectus et netus et malesuada fames. Tellus orci ac
            auctor augue mauris augue neque gravida. Elit ut aliquam purus sit
            amet luctus venenatis. Quam pellentesque nec nam aliquam sem et
            tortor. Erat pellentesque adipiscing commodo elit at imperdiet dui
            accumsan sit. At augue eget arcu dictum varius duis at consectetur
            lorem. Integer eget aliquet nibh praesent tristique magna sit amet
            purus. Consectetur adipiscing elit pellentesque habitant morbi
            tristique. Montes nascetur ridiculus mus mauris vitae. Pharetra sit
            amet aliquam id diam maecenas ultricies mi. Aenean vel elit
            scelerisque mauris pellentesque pulvinar pellentesque habitant.
            Nullam non nisi est sit amet facilisis. Sed augue lacus viverra
            vitae congue eu consequat. Convallis convallis tellus id interdum.
            Velit ut tortor pretium viverra suspendisse potenti nullam ac
            tortor. Quis risus sed vulputate odio ut enim blandit. Fringilla
            phasellus faucibus scelerisque eleifend donec pretium vulputate
            sapien. Euismod elementum nisi quis eleifend quam. Diam vulputate ut
            pharetra sit amet aliquam id diam maecenas. Orci porta non pulvinar
            neque laoreet. Vel risus commodo viverra maecenas accumsan lacus
            vel. Enim diam vulputate ut pharetra sit amet aliquam id diam. Est
            pellentesque elit ullamcorper dignissim cras tincidunt. Quam
            elementum pulvinar etiam non quam lacus suspendisse faucibus. Lacus
            vel facilisis volutpat est velit egestas dui id ornare. Egestas
            integer eget aliquet nibh praesent tristique magna. Enim neque
            volutpat ac tincidunt vitae semper quis lectus. Sed pulvinar proin
            gravida hendrerit. Porta nibh venenatis cras sed. Tristique senectus
            et netus et malesuada. Nibh sit amet commodo nulla. Ullamcorper
            malesuada proin libero nunc consequat interdum varius sit.
            Consectetur libero id faucibus nisl tincidunt. Volutpat consequat
            mauris nunc congue nisi vitae. A scelerisque purus semper eget duis
            at. Sem fringilla ut morbi tincidunt augue interdum velit euismod
            in. Massa enim nec dui nunc mattis enim ut tellus. Urna porttitor
            rhoncus dolor purus non enim praesent. Est sit amet facilisis magna
            etiam tempor orci. Donec pretium vulputate sapien nec sagittis
            aliquam malesuada. Suscipit tellus mauris a diam maecenas. Nunc sed
            blandit libero volutpat sed. Turpis egestas sed tempus urna et.
            Vestibulum mattis ullamcorper velit sed ullamcorper. Est
            pellentesque elit ullamcorper dignissim. Amet mauris commodo quis
            imperdiet massa tincidunt nunc pulvinar. Congue nisi vitae suscipit
            tellus mauris a diam maecenas sed. Porttitor massa id neque aliquam
            vestibulum morbi blandit cursus. Arcu vitae elementum curabitur
            vitae nunc sed velit dignissim. Facilisis leo vel fringilla est
            ullamcorper eget nulla facilisi etiam. Lacinia at quis risus sed
            vulputate odio ut. Sed viverra tellus in hac habitasse. Eget duis at
            tellus at. Molestie ac feugiat sed lectus vestibulum mattis
            ullamcorper. At consectetur lorem donec massa sapien faucibus et.
            Vulputate mi sit amet mauris commodo quis imperdiet. Adipiscing
            vitae proin sagittis nisl rhoncus mattis rhoncus urna. Imperdiet dui
            accumsan sit amet nulla facilisi. Egestas dui id ornare arcu odio
            ut. Proin sagittis nisl rhoncus mattis. Ut consequat semper viverra
            nam libero. Vitae turpis massa sed elementum tempus. Id nibh tortor
            id aliquet lectus proin. Pellentesque adipiscing commodo elit at.
            Volutpat blandit aliquam etiam erat. Tristique nulla aliquet enim
            tortor at auctor urna nunc id. Lorem ipsum dolor sit amet
            consectetur adipiscing elit duis tristique. Pellentesque massa
            placerat duis ultricies. Mauris sit amet massa vitae tortor
            condimentum lacinia quis. Dui id ornare arcu odio. Dolor sit amet
            consectetur adipiscing elit ut aliquam.
        </div>
    ),
};
