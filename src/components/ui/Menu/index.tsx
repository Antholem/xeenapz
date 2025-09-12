"use client";

import { useRef, type ReactElement, type ReactNode } from "react";
import {
  Box,
  Flex,
  Icon,
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  type MenuProps as ChakraMenuProps,
  useColorMode,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoIosCheckmark } from "react-icons/io";
import Button from "../Button";
import MenuList from "../MenuList";
import MenuItem from "../MenuItem";
import { useAccentColor } from "@/stores";

interface MenuItemData {
  label: ReactNode;
  value: string;
  icon?: ReactElement;
}

interface MenuProps extends Omit<ChakraMenuProps, "children"> {
  items: MenuItemData[];
  value: string | null;
  onChange: (value: string | null) => void | Promise<void>;
  placeholder?: string;
  includeNullOption?: boolean;
  buttonProps?: ButtonProps;
}

const Menu = ({
  items,
  value,
  onChange,
  placeholder = "Select...",
  includeNullOption = true,
  buttonProps,
  ...props
}: MenuProps) => {
  const selectedRef = useRef<HTMLDivElement>(null);
  const selectedItem = items.find((i) => i.value === value);
  const selectedLabel = selectedItem?.label ?? placeholder;
  const selectedIcon = selectedItem?.icon;
  const { colorMode } = useColorMode();
  const { accentColor } = useAccentColor();
  const selectedColor =
    colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.500`;

  return (
    <ChakraMenu initialFocusRef={selectedRef} {...props}>
      <ChakraMenuButton
        as={Button}
        colorScheme="gray"
        w="full"
        variant="solid"
        justifyContent="space-between"
        overflow="hidden"
        leftIcon={selectedIcon}
        rightIcon={<HiOutlineChevronDown />}
        {...buttonProps}
      >
        <Box
          flex="1"
          textAlign="left"
          minW={0}
          textOverflow="ellipsis"
          overflow="hidden"
          whiteSpace="nowrap"
        >
          {selectedLabel}
        </Box>
      </ChakraMenuButton>
      <MenuList maxH="200px" overflowY="auto">
        {includeNullOption && (
          <MenuItem
            ref={value === null ? selectedRef : undefined}
            onClick={() => onChange(null)}
            color={value === null ? selectedColor : undefined}
          >
            <Flex align="center" justify="space-between" w="full">
              {placeholder}
              {value === null && <Icon as={IoIosCheckmark} boxSize={6} />}
            </Flex>
          </MenuItem>
        )}
        {items.map((item) => (
          <MenuItem
            key={item.value}
            ref={item.value === value ? selectedRef : undefined}
            onClick={() => onChange(item.value)}
            color={item.value === value ? selectedColor : undefined}
            icon={item.icon}
          >
            <Flex align="center" justify="space-between" w="full">
              {item.label}
              {item.value === value && <Icon as={IoIosCheckmark} boxSize={6} />}
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </ChakraMenu>
  );
};

export default Menu;
