"use client";

import { useRef, useState, useLayoutEffect, useMemo } from "react";
import {
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  type MenuProps as ChakraMenuProps,
  useColorMode,
} from "@chakra-ui/react";
import type { ButtonProps } from "@chakra-ui/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import Button from "../Button";
import MenuList from "../MenuList";
import MenuItem from "../MenuItem";
import { useAccentColor } from "@/stores";

interface MenuItemData {
  label: string;
  value: string;
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
  const selectedLabel =
    items.find((i) => i.value === value)?.label ?? placeholder;
  const { colorMode } = useColorMode();
  const { accentColor } = useAccentColor();
  const selectedColor =
    colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.500`;

  const measureRef = useRef<HTMLButtonElement>(null);
  const [menuWidth, setMenuWidth] = useState<string>();
  const longestLabel = useMemo(() => {
    const labels = items.map((i) => i.label);
    if (includeNullOption) labels.push(placeholder);
    return labels.reduce((a, b) => (a.length > b.length ? a : b), "");
  }, [items, includeNullOption, placeholder]);

  useLayoutEffect(() => {
    if (measureRef.current) {
      setMenuWidth(`${measureRef.current.getBoundingClientRect().width}px`);
    }
  }, [longestLabel, buttonProps]);

  return (
    <>
      <Button
        ref={measureRef}
        colorScheme="gray"
        variant="solid"
        textAlign="left"
        rightIcon={<HiOutlineChevronDown />}
        {...buttonProps}
        size="md"
        fontSize="md"
        px={3}
        w="auto"
        position="absolute"
        visibility="hidden"
        pointerEvents="none"
        whiteSpace="nowrap"
      >
        {longestLabel}
      </Button>
      <ChakraMenu initialFocusRef={selectedRef} {...props}>
        <ChakraMenuButton
          as={Button}
          colorScheme="gray"
          variant="solid"
          textAlign="left"
          rightIcon={<HiOutlineChevronDown />}
          {...buttonProps}
          w={{ base: "full", md: menuWidth }}
        >
          {selectedLabel}
        </ChakraMenuButton>
        <MenuList
          maxH="200px"
          overflowY="auto"
          w={{ base: "full", md: menuWidth }}
          minW="0"
        >
          {includeNullOption && (
            <MenuItem
              ref={value === null ? selectedRef : undefined}
              onClick={() => onChange(null)}
              color={value === null ? selectedColor : undefined}
          >
            {placeholder}
          </MenuItem>
        )}
          {items.map((item) => (
            <MenuItem
              key={item.value}
              ref={item.value === value ? selectedRef : undefined}
              onClick={() => onChange(item.value)}
              color={item.value === value ? selectedColor : undefined}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuList>
      </ChakraMenu>
    </>
  );
};

export default Menu;
