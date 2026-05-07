package com.dylanvann.fastimage;

import androidx.annotation.Nullable;

/**
 * Mirrors the JS-side `transition` prop values exposed by FastImage.
 * Matches FFFTransition enum on iOS for cross-platform parity.
 */
enum FastImageTransition {
    NONE,
    FADE;

    static FastImageTransition fromString(@Nullable String value) {
        if (value == null) return NONE;
        switch (value) {
            case "fade":
                return FADE;
            case "none":
            default:
                return NONE;
        }
    }
}
