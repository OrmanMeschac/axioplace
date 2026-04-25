/**
 * FastImage — Composant Image universel pour Axioplace Mobile
 * 
 * Utilise expo-image pour un cache mémoire + disque natif.
 * Compatible Android (APK) et iOS (IPA) sur vrais appareils.
 * - contentFit="cover" remplace resizeMode="cover"
 * - cachePolicy="memory-disk" : image vue une fois = chargée instantanément
 * - transition={250} : fondu doux à l'apparition
 * - Fallback automatique si erreur réseau
 */
import React, { useState } from 'react';
import { Image as RNImage, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const PLACEHOLDER_BLURHASH =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQayj[ayj[ayofj[';

const PLACEHOLDER_SRC = require('../../assets/favicon.png');

/**
 * @param {object}  props
 * @param {object}  props.source          - { uri: string } ou require()
 * @param {object}  [props.style]         - Style RN
 * @param {'cover'|'contain'|'fill'|'scale-down'|'none'} [props.contentFit='cover']
 * @param {'high'|'normal'|'low'} [props.priority='normal']
 * @param {boolean} [props.showPlaceholder=true]
 */
export default function FastImage({
    source,
    style,
    contentFit = 'cover',
    priority = 'normal',
    showPlaceholder = true,
    onError,
    ...rest
}) {
    const [hasError, setHasError] = useState(false);

    const handleError = (e) => {
        setHasError(true);
        onError?.(e);
    };

    // Si erreur ou pas de source URI valide → fallback natif RN
    if (hasError || !source?.uri) {
        return (
            <RNImage
                source={PLACEHOLDER_SRC}
                style={[styles.fallback, style]}
                resizeMode="cover"
                {...rest}
            />
        );
    }

    return (
        <Image
            source={source}
            style={style}
            contentFit={contentFit}
            cachePolicy="memory-disk"
            priority={priority}
            placeholder={showPlaceholder ? { blurhash: PLACEHOLDER_BLURHASH } : undefined}
            transition={200}
            onError={handleError}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    fallback: {
        backgroundColor: '#f1f5f9',
    },
});
