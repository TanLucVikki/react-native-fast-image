import React, { useMemo } from 'react'
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated from 'react-native-reanimated'

const NUM_COLUMNS = 4
const NUM_IMAGES = 100
const SPACING = 4
const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_SIZE =
  (SCREEN_WIDTH - SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS

type Item = { id: string; uri: string }

const buildData = (): Item[] =>
  Array.from({ length: NUM_IMAGES }, (_, i) => ({
    id: String(i),
    // picsum.photos `?index=` is a query, not a seed — use /seed/<n> for stable, distinct images
    uri: `https://picsum.photos/seed/${i}/2056/2056`,
  }))


const Home = () => {
  const data = useMemo(buildData, [])

  const renderItem: ListRenderItem<Item> = ({ item }) => (
    <FastImage
      style={styles.cell}
      source={{ uri: item.uri }}
      resizeMode="cover"
      allowDownscaling={false}
      transition='fade'
    />
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        initialNumToRender={16}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: SPACING },
  row: { gap: SPACING, marginBottom: SPACING },
  cell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
})
