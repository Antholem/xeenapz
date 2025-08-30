"use client";

import {
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  Button,
  type ButtonProps,
  useColorMode,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Children,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useAccentColor } from "@/stores";

interface SelectProps extends Omit<ButtonProps, "onChange"> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: ReactNode;
  children:
    | ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>
    | ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>[];
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ value = "", onChange, placeholder, children, ...props }, ref) => {
    const { accentColor } = useAccentColor();
    const { colorMode } = useColorMode();

    const options = Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        const option =
          child as ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>;
        return {
          value: option.props.value ?? "",
          label: option.props.children,
          disabled: option.props.disabled,
        };
      });

    const selected = options.find((o) => o.value === value);

    const highlightBg =
      colorMode === "dark" ? `${accentColor}.600` : `${accentColor}.200`;
    const highlightColor =
      colorMode === "dark" ? "white" : "gray.800";
    const focusBorderColor =
      colorMode === "dark" ? `${accentColor}.300` : `${accentColor}.400`;

    const handleChange = (val: string | string[]) => {
      const stringVal = Array.isArray(val) ? val[0] : val;
      const syntheticEvent = {
        target: { value: stringVal },
      } as ChangeEvent<HTMLSelectElement>;
      onChange?.(syntheticEvent);
    };

    return (
      <Menu matchWidth>
        <MenuButton
          as={Button}
          ref={ref}
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          textAlign="left"
          _focus={{
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
          }}
          {...props}
        >
          {selected ? selected.label : placeholder}
        </MenuButton>
        <MenuList zIndex={10}>
          <MenuOptionGroup
            type="radio"
            value={value}
            onChange={handleChange}
          >
            {options.map((o) => (
              <MenuItemOption
                key={o.value}
                value={o.value}
                isDisabled={o.disabled}
                _focus={{ bg: highlightBg, color: highlightColor }}
                _active={{ bg: highlightBg, color: highlightColor }}
                _hover={{ bg: highlightBg, color: highlightColor }}
                _checked={{ bg: highlightBg, color: highlightColor }}
              >
                {o.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    );
  }
);

Select.displayName = "Select";

export default Select;
