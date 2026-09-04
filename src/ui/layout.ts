import {useWindowDimensions} from 'react-native';

export function useRitimLayout(){
  const {width,height}=useWindowDimensions();
  const compact=width<360;
  const tablet=width>=700;
  const wide=width>=1000;
  const horizontalPadding=compact?14:tablet?28:18;
  const gap=compact?8:12;
  const maxContentWidth=wide?1100:tablet?820:620;
  const gridColumns=wide?4:tablet?3:2;
  const availableWidth=Math.min(width,maxContentWidth)-horizontalPadding*2;
  const gridCardWidth=Math.floor((availableWidth-gap*(gridColumns-1))/gridColumns);
  const playerArtworkSize=Math.min(width-horizontalPadding*2,tablet?520:620);
  return {width,height,compact,tablet,wide,horizontalPadding,gap,maxContentWidth,gridColumns,gridCardWidth,playerArtworkSize};
}
