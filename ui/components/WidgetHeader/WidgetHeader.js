import React, { useContext } from "react"

import { includes } from "lodash"
import { useRouter } from "next/router"
import HeaderForm from "../../components/HeaderForm/HeaderForm"
import LogoLBA from "../../components/LogoLBA/LogoLBA"

import { Box, Flex, Text } from "@chakra-ui/react"
import { SearchResultContext } from "../../context/SearchResultContextProvider"

const WidgetHeader = ({ handleSearchSubmit, isHome }) => {
  const router = useRouter()

  const { selectedItem } = useContext(SearchResultContext)

  const handleSearchSubmitFunction = (values) => {
    return handleSearchSubmit({ values })
  }

  const isFicheDetail = selectedItem && includes(router.asPath, "page=fiche") ? true : false
  const formDisplayValue = isFicheDetail ? "none" : isHome ? "block" : ["none", "none", "block"]

  return (
    <Box zIndex={9} display={formDisplayValue} boxShadow={isHome ? "none" : "0 0 12px 2px rgb(0 0 0 / 21%)"} padding="8px">
      <Flex>
        {!isHome && <LogoLBA />}

        <Box>
          {isHome && (
            <Text mb={3} as="h1" fontSize={["26px", "29px"]} fontWeight={700}>
              <Text as="span" display={{ base: "block", md: "inline" }}>
                Trouvez emploi et formation{" "}
              </Text>
              <Text as="span" color="info" display={{ base: "block", md: "inline" }}>
                en alternance
              </Text>
            </Text>
          )}
          <HeaderForm handleSearchSubmit={handleSearchSubmitFunction} isHome={isHome} />
        </Box>
      </Flex>
    </Box>
  )
}

export default WidgetHeader
