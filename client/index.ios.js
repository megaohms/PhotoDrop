var React = require('react-native');
var Login = require('./App/Components/Login');

var {
  AppRegistry,
  StyleSheet,
  Navigator
} = React;

console.ignoredYellowBox = ['jsSchedulingOverhead'];

class PhotoDrop extends React.Component {
  render() {
    return (
      <Navigator
        initialRoute={{
          component: Login
        }}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig;
          }
          return Navigator.SceneConfigs.FloatFromBottom;
        }}
        renderScene={(route, navigator) => {
          if (route.component) {
            return React.createElement(route.component, { navigator, route });
          }
        }}
      />
    );
  }
}

AppRegistry.registerComponent('PhotoDrop', () => PhotoDrop);
