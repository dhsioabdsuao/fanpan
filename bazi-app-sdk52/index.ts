// 必须先于一切 CloudBase/BSON 代码执行:提供 crypto.getRandomValues
// (RN 运行时缺失,BSON 生成 ObjectId 需要;缺失时写操作静默挂起)
import 'react-native-get-random-values';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
