"use client";

import { FC } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Grid,
  Box,
  Text,
  Code,
  Link,
  Icon,
  HStack,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiExternalLink, FiCopy } from "react-icons/fi";
import packageJson from "../../../package.json";

// Optional build/env metadata (fallbacks are safe)
const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "";
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? "";

const RELEASE_NOTES_URL = "https://github.com/owner/repo/releases";
const ISSUES_URL = "https://github.com/owner/repo/issues";
const LICENSE_URL = "https://github.com/owner/repo/blob/main/LICENSE";
const CREDITS_URL = "https://github.com/owner/repo#credits";
const DOCS_URL = "https://github.com/owner/repo#readme";
const SUPPORT_EMAIL = "developer@example.com";

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <Grid
      templateColumns={{ base: "1fr", sm: "200px 1fr" }}
      columnGap={4}
      rowGap={1.5}
      alignItems="center"
    >
      <Text fontWeight="medium">{label}</Text>
      <Box minW={0}>{children}</Box>
    </Grid>
  );
};

const CopyButton = ({
  value,
  "aria-label": ariaLabel,
}: {
  value: string;
  "aria-label"?: string;
}) => (
  <Button
    size="xs"
    variant="ghost"
    leftIcon={<FiCopy />}
    aria-label={ariaLabel ?? "Copy value"}
    onClick={() => navigator.clipboard.writeText(value)}
  >
    Copy
  </Button>
);

const External = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    isExternal
    display="inline-flex"
    alignItems="center"
    gap={1}
  >
    {children}
    <Icon as={FiExternalLink} aria-hidden />
  </Link>
);

const About: FC = () => {
  const muted = useColorModeValue("gray.600", "gray.400");
  const sectionTitle = (title: string) => (
    <Text fontWeight="semibold" fontSize="lg">
      {title}
    </Text>
  );

  return (
    <Flex direction="column" gap={4}>
      {/* About this app */}
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          {sectionTitle("About this app")}
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <InfoRow label="Version">
              <HStack spacing={3} wrap="wrap">
                <Code>{packageJson.version}</Code>
                <CopyButton
                  value={packageJson.version}
                  aria-label="Copy version"
                />
              </HStack>
            </InfoRow>

            <InfoRow label="Build">
              <Flex
                direction={{ base: "column", sm: "row" }}
                gap={2}
                align={{ sm: "center" }}
              >
                <HStack spacing={3} wrap="wrap">
                  <Text fontSize="sm" color={muted}>
                    {BUILD_DATE ? new Date(BUILD_DATE).toLocaleString() : "—"}
                  </Text>
                </HStack>
                <HStack spacing={3} wrap="wrap">
                  <Code>{BUILD_SHA ? BUILD_SHA.slice(0, 7) : "—"}</Code>
                  {BUILD_SHA && (
                    <CopyButton
                      value={BUILD_SHA}
                      aria-label="Copy commit SHA"
                    />
                  )}
                </HStack>
              </Flex>
            </InfoRow>

            <InfoRow label="Release notes">
              <External href={RELEASE_NOTES_URL}>See releases</External>
            </InfoRow>

            <InfoRow label="Documentation">
              <External href={DOCS_URL}>Open docs</External>
            </InfoRow>
          </Flex>
        </CardBody>
      </Card>

      {/* Support */}
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          {sectionTitle("Contact & Support")}
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={4}>
            <InfoRow label="Email">
              <HStack spacing={3} wrap="wrap">
                <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
                <CopyButton value={SUPPORT_EMAIL} aria-label="Copy email" />
              </HStack>
            </InfoRow>
            <InfoRow label="Issue tracker">
              <External href={ISSUES_URL}>GitHub Issues</External>
            </InfoRow>
          </Flex>
        </CardBody>
      </Card>

      {/* Legal */}
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          {sectionTitle("Licenses & Credits")}
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={2}>
            <Text>
              This project uses open-source software. See the documentation and
              third-party licenses for details.
            </Text>
            <HStack spacing={6} wrap="wrap">
              <External href={LICENSE_URL}>License</External>
              <External href={CREDITS_URL}>Credits</External>
            </HStack>
          </Flex>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default About;

