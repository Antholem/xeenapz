"use client";

import { Box, useColorMode, useTheme } from "@chakra-ui/react";

const SideBar = () => {
    const { colorMode } = useColorMode();
    const theme = useTheme();
    const bgColor = theme.styles.global({ colorMode }).body.bg;

    return (
        <Box
            as="nav"
            w="250px"
            zIndex="50"
            borderRight="1px solid"
            borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
            bg={bgColor}
        >
        </Box>
    );
};

export default SideBar;
