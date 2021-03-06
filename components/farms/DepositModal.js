import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useWallet } from "use-wallet";
import { utils as ethersUtils } from "ethers";

import _get from "lodash/get";
import _size from "lodash/size";
import _trim from "lodash/trim";
import _isUndefined from "lodash/isUndefined";

import { useContracts } from "../../hooks/useContracts";

import { isWalletConnected } from "../../lib/wallet";

import { formatNumber, isValidNumber } from "../../lib/numeric";
import usePrevious from "../../hooks/usePrevious";

import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber,
  Input,
  InputGroup,
  InputRightElement,
  Tooltip,
  useDisclosure,
  useStyleConfig,
  useBreakpointValue,
} from "@chakra-ui/core";

import { AddIcon } from "@chakra-ui/icons";

import InlineSpinner from "../spinners/Inline";
import FormErrors from "../forms/FormErrors";

import config from "./config";

const DepositModal = ({
  farmId,
  userTokenBalance,
  isDepositing,
  setIsDepositing,
  totalTokenRewards,
  usersTotalDepositied,
}) => {
  const wallet = useWallet();
  const { dmtStaking } = useContracts();

  const [tokenInputValue, setTokenInputValue] = useState("");
  const prevIsDepositing = usePrevious(!isDepositing ? false : true);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const closeBtnStyles = useStyleConfig("Button", { variant: "icon-trans" });
  const depositBtnStyles = useStyleConfig("Button", { variant: "icon-round" });
  const primaryBtnStyles = useStyleConfig("Button", { variant: "primary" });
  const cancelBtnStyles = useStyleConfig("Button", { variant: "ghost-matched" });

  const isModalCentered = useBreakpointValue({ base: false, md: true });

  const [formErrors, setFormErrors] = useState(null);

  /**
   * Close modal once deposit transaction completes (previous deposit amount !== latest deposit amount).
   */
  useEffect(() => {
    if (prevIsDepositing && !isDepositing) onClose();
  }, [isDepositing]);

  const handleTokenInputChange = event => {
    const value = _get(event, "target.value");

    checkTokenInputValue(value);

    setTokenInputValue(value);
  };

  const handleMaxValueClick = () => {
    checkTokenInputValue(userTokenBalance);

    setTokenInputValue(userTokenBalance);
  };

  const handleDepositClick = () => {
    const formattedValue = _trim(tokenInputValue.toString());

    if (
      !checkTokenInputValue(tokenInputValue) || 
      !formattedValue || 
      !isWalletConnected(wallet) || 
      !wallet.ethereum
    ) {
      return;
    }

    dmtStaking.stake(ethersUtils.parseEther(formattedValue))
      .then(_ => {
        setTokenInputValue("");

        setIsDepositing(true);
      })
      .catch(_ => {});
  };

  const checkTokenInputValue = value => {
    if (value === "") {
      setFormErrors(null);

      return false;
    }

    const errors = [];

    if (!isValidNumber(value, 0.1, userTokenBalance)) errors.push("Enter a valid amount.");

    if (_size(errors)) {
      setFormErrors(errors);

      return false;
    }
    
    setFormErrors(null);
    
    return true;
  };

  const {
    openTooltipCopy,
    titleCopy,
    tokenIcon: TokenIcon,
    totalRewardsCopy,
    usersTotalDepositedCopy,
    userBalanceCopy,
    spinnerMessage,
  } = config[farmId].depositModal;

  return (
    <>
      <Tooltip 
        color="whiteAlpha.900"
        fontSize="md"
        label={openTooltipCopy} 
        closeDelay={50}
        backgroundColor="purple.800"
        borderRadius="lg"
        padding="0.5rem 0.875rem"
        hasArrow 
      >
        <IconButton 
          onClick={onOpen} 
          aria-label="Stake" 
          sx={depositBtnStyles} 
          marginX={4} 
          icon={<AddIcon boxSize={6} />}
        />
      </Tooltip>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        isCentered={isModalCentered} 
        size="lg" 
        scrollBehavior="outside" 
        autoFocus={false} 
        returnFocusOnClose={false}
      >
        <ModalOverlay background="blackAlpha.800">
          <ModalContent marginY={16} marginX={4} background="gray.900" borderRadius="lg">
            <ModalHeader 
              fontSize="2rem" 
              fontWeight="bold" 
              textAlign="center"
              paddingX="4rem" 
              paddingTop={6}
              paddingBottom={2} 
            >
              {titleCopy}
              <Flex justifyContent="center" paddingTop={6}>
                <TokenIcon />
              </Flex>
            </ModalHeader>
            <ModalCloseButton size="lg" sx={closeBtnStyles} top="12px" />
            <ModalBody padding={0}>
              <InlineSpinner 
                isLoading={isDepositing} 
                minHeight="15.125rem"
                message={spinnerMessage}
              >
                <Flex justifyContent="center" paddingBottom={6} flexDirection={{ base: "column", sm: "row" }}>
                  <Box>
                    <Stat padding={6} paddingBottom={0}>
                      <StatLabel fontSize="lg" textAlign="center" color="gray.400">{totalRewardsCopy}</StatLabel>
                      <StatNumber textAlign="center">{formatNumber(totalTokenRewards, 4)}</StatNumber>
                    </Stat>
                  </Box>
                  <Box>
                    <Stat padding={6} paddingBottom={0}>
                      <StatLabel fontSize="lg" textAlign="center" color="gray.400">{usersTotalDepositedCopy}</StatLabel>
                      <StatNumber textAlign="center">{formatNumber(usersTotalDepositied)}</StatNumber>
                    </Stat>
                  </Box>
                </Flex>
                <Text fontSize="lg" textAlign="center" color="gray.500" paddingBottom={8} paddingX={6}>
                  {userBalanceCopy} <Text as="span" color="white">{formatNumber(userTokenBalance)}</Text>
                </Text>
                <Box paddingTop={0} paddingX={6}>
                  <form>
                    <InputGroup size="md">
                      <Input 
                        type="text"
                        fontSize="lg" 
                        padding="0.5rem 5.125rem 0.5rem 1rem"
                        height="auto"
                        backgroundColor="blackAlpha.400"
                        placeholder="0.00" 
                        value={tokenInputValue}
                        onChange={handleTokenInputChange}
                      />
                      <InputRightElement 
                        width="auto" 
                        height="auto" 
                        paddingX={0} 
                        top="0.375rem" 
                        right="0.375rem"
                      >
                        <Button 
                          size="sm" 
                          height="auto" 
                          padding="0.375rem 0.875rem" 
                          lineHeight="base" 
                          onClick={handleMaxValueClick}
                        >
                          MAX
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrors errors={formErrors} />
                  </form>
                </Box>
              </InlineSpinner>
            </ModalBody>
            <ModalFooter>
              <Button marginRight={3} sx={primaryBtnStyles} onClick={handleDepositClick} disabled={isDepositing}>Stake</Button>
              <Button sx={cancelBtnStyles} onClick={onClose} disabled={isDepositing}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
};

DepositModal.propTypes = {
  farmId: PropTypes.string.isRequired,
  userTokenBalance: PropTypes.number,
  isDepositing: PropTypes.bool.isRequired,
  setIsDepositing: PropTypes.func.isRequired,
  totalTokenRewards: PropTypes.number,
  usersTotalDepositied: PropTypes.number,
};

export default DepositModal;
