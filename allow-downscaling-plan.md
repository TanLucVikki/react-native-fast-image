# FastImage `allowDownscaling` Implementation Plan

## Goal

Add an `allowDownscaling?: boolean` prop to the FastImage fork, based on Expo Image behavior.

Expo Image behavior:

- Default is `true`.
- When `true`, the native image pipeline may downscale large images to match the image view size.
- When `false`, the image should keep the highest available decoded quality.
- Turning it off can increase memory usage and can crash on very large images.

## Proposed API

```tsx
<FastImage
  source={{ uri: imageUrl }}
  resizeMode={FastImage.resizeMode.contain}
  allowDownscaling={false}
/>
```

TypeScript:

```ts
export interface FastImageProps extends AccessibilityProps, ViewProps {
  source?: Source | number;
  defaultSource?: ImageRequireSource;
  resizeMode?: ResizeMode;
  fallback?: boolean;
  tintColor?: ColorValue;
  onLoadStart?: () => void;
  onProgress?: (event: OnProgressEvent) => void;
  onLoad?: (event: OnLoadEvent) => void;
  onError?: () => void;
  onLoadEnd?: () => void;
  allowDownscaling?: boolean;
}
```

Default:

```ts
allowDownscaling = true
```

## JS Changes

Files in the FastImage fork:

- `src/index.tsx` or current JS entry file
- `dist/index.d.ts`
- `dist/index.js`
- Flow declarations if kept

Tasks:

1. Add `allowDownscaling?: boolean` to public prop types.
2. Default prop to `true`.
3. Pass `allowDownscaling` to the native component.
4. Keep backward compatibility for apps that do not pass the prop.

## iOS Plan

Files:

- `ios/FastImage/FFFastImageView.h`
- `ios/FastImage/FFFastImageView.m`
- `ios/FastImage/FFFastImageViewManager.m`

Tasks:

1. Add property:

```objc
@property (nonatomic, assign) BOOL allowDownscaling;
```

2. Set default in `init`:

```objc
self.allowDownscaling = YES;
```

3. Export prop:

```objc
RCT_EXPORT_VIEW_PROPERTY(allowDownscaling, BOOL)
```

4. During image completion, only resize/process downscale when:

```objc
self.allowDownscaling == YES
```

5. When `allowDownscaling == NO`, render original image and let `contentMode` handle visual fitting.

Implementation options:

| Option | Description | Recommendation |
| --- | --- | --- |
| Post-load resize | Load image normally, then resize before assigning to image view | Simple and close to Expo's iOS logic |
| SDWebImage transformer | Add context transformer based on measured view size | Better cache behavior but more complex |

Recommended first implementation: post-load resize, because FastImage is already Objective-C and the change is easier to isolate.

Important:

- Do not downscale animated images until GIF/WebP behavior is tested.
- Do not change `resizeMode` visual behavior.
- Make sure `onLoad` still reports source dimensions consistently.

## Android Plan

Files:

- `android/src/main/java/com/dylanvann/fastimage/FastImageViewManager.java`
- `android/src/main/java/com/dylanvann/fastimage/FastImageViewWithUrl.java`
- `android/src/main/java/com/dylanvann/fastimage/FastImageViewConverter.java`

Tasks:

1. Add field to `FastImageViewWithUrl`:

```java
private boolean mAllowDownscaling = true;
```

2. Add setter:

```java
public void setAllowDownscaling(boolean allowDownscaling) {
    mNeedsReload = true;
    mAllowDownscaling = allowDownscaling;
}
```

3. Export React prop in manager:

```java
@ReactProp(name = "allowDownscaling", defaultBoolean = true)
public void setAllowDownscaling(FastImageViewWithUrl view, boolean allowDownscaling) {
    view.setAllowDownscaling(allowDownscaling);
}
```

4. Apply Glide sizing behavior when building the request:

```java
RequestOptions options = FastImageViewConverter.getOptions(context, imageSource, mSource)
    .placeholder(mDefaultSource)
    .fallback(mDefaultSource);

if (!mAllowDownscaling) {
    options = options.override(Target.SIZE_ORIGINAL);
}
```

5. For `allowDownscaling=true`, consider explicitly using view dimensions only when they are known:

```java
if (mAllowDownscaling && getWidth() > 0 && getHeight() > 0) {
    options = options.override(getWidth(), getHeight());
}
```

Important:

- `Target.SIZE_ORIGINAL` can decode huge bitmaps and cause OOM.
- If view width/height are `0`, do not force override.
- Re-request image after layout if the first request happened before dimensions were known.
- Test `center`, `contain`, and zoom use cases carefully.

## Behavior Matrix

| Prop | Expected behavior |
| --- | --- |
| `allowDownscaling` omitted | Existing behavior or optimized downscaling, default `true` |
| `allowDownscaling={true}` | Decode near display size when safe |
| `allowDownscaling={false}` | Preserve original decoded quality |
| `resizeMode="center"` | Prefer no downscaling |
| `resizeMode="stretch"` | Do not rely on downscaling for visual stretch |

## Test Plan

Example app tests:

- Large remote JPEG in a small view.
- Same JPEG inside zoom viewer.
- `allowDownscaling=true` memory comparison.
- `allowDownscaling=false` quality comparison.
- GIF and animated WebP.
- FlatList with recycled rows.
- Image with auth headers.
- Image with `defaultSource`.
- Cache hit after app restart.

Host app tests:

- Screens that use `react-native-image-zoom-viewer`.
- Screens that use `@likashefqet/react-native-image-zoom`.
- Screens with many thumbnails.
- Screens with remote images requiring headers.

## Acceptance Criteria

- Existing FastImage usage works without prop changes.
- New prop is available in TypeScript.
- iOS build passes with RN `0.78.3` and iOS min `15.5`.
- Android build passes with RN `0.78.3` and minSdk `26`.
- `allowDownscaling=false` visibly improves zoom quality for large images.
- `allowDownscaling=true` keeps memory usage lower than `false`.
- No stale image regressions in virtualized lists.

## Notes From Expo Image

Expo Image documents `allowDownscaling` as default `true` and warns that disabling it can hurt performance, especially with large assets. Expo's iOS implementation processes loaded images against an ideal size and only downscales when the prop allows it. The FastImage fork should copy the behavior, not the Expo module architecture.

Reference:

- https://docs.expo.dev/versions/latest/sdk/image
- https://github.com/expo/expo/tree/main/packages/expo-image
