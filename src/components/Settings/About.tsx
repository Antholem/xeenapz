"use client";

import { FC } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Text,
  Link,
} from "@chakra-ui/react";
import packageJson from "../../../package.json";

const About: FC = () => {
  return (
    <Flex direction="column" gap={4}>
      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            App Version / Release Notes
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Text>Version: {packageJson.version}</Text>
          <Text mt={2}>
            See{' '}
            <Link href="https://github.com/owner/repo/releases" isExternal>
              release notes
            </Link>
            .
          </Text>
        </CardBody>
      </Card>

      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Contact Developer
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Flex direction="column" gap={2}>
            <Link href="mailto:developer@example.com">
              developer@example.com
            </Link>
            <Link href="https://github.com/owner/repo/issues" isExternal>
              GitHub Issues
            </Link>
          </Flex>
        </CardBody>
      </Card>

      <Card bg="transparent" variant="outline">
        <CardHeader px={4} py={3}>
          <Text fontWeight="semibold" fontSize="lg">
            Licenses & Credits
          </Text>
        </CardHeader>
        <Divider />
        <CardBody p={4}>
          <Text>
            This project uses open source software. See the documentation and
            third-party licenses for details.
          </Text>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default About;
