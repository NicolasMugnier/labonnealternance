import { Box, Image, SimpleGrid, Text } from "@chakra-ui/react"
import React from "react"

import offreemploiImage from "../../public/images/home_pics/illu-offreemploi.svg"

const PostezVotreOffre = () => {
  return (
    <Box as="section" py={3} mb={{ base: "2", md: "5" }}>
      <SimpleGrid columns={{ sm: 1, md: 2 }} spacing="40px" alignItems={"center"} mt={12}>
        <Box>
          <Image src={offreemploiImage} alt="" />
        </Box>
        <Box>
          <Text as="h2" variant="homeEditorialH2" mb={{ base: "3", lg: "5" }}>
            Postez votre offre d'alternance en quelques secondes
          </Text>
          {/* @ts-expect-error: TODO */}
          <Box variant="homeEditorialText">
            Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans votre compte en vous connectant avec votre email
            uniquement.
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  )
}

export default PostezVotreOffre
