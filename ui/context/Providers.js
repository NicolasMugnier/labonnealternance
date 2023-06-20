import { ChakraProvider } from "@chakra-ui/react"
import PlausibleProvider from "next-plausible"
import React from "react"
import { QueryClient, QueryClientProvider } from "react-query"
import theme from "../theme/index"
import DisplayContextProvider from "./DisplayContextProvider"
import ParameterContextProvider from "./ParameterContextProvider"
import SearchResultContextProvider from "./SearchResultContextProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const Providers = ({ env, children }) => {
  return (
    <ChakraProvider theme={theme}>
      <PlausibleProvider
        domain={env !== "production" ? "labonnealternance-recette2.apprentissage.beta.gouv.fr" : "labonnealternance.apprentissage.beta.gouv.fr"}
        trackOutboundLinks={true}
        trackLocalhost={true}
        enabled={true}
      >
        <SearchResultContextProvider>
          <ParameterContextProvider>
            <DisplayContextProvider>
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </DisplayContextProvider>
          </ParameterContextProvider>
        </SearchResultContextProvider>
      </PlausibleProvider>
    </ChakraProvider>
  )
}

export default Providers
