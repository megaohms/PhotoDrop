var React = require('react-native');
var {
  Navigator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity
} = React;

class StreamMarker extends React.Component{
  constructor(props){
    super(props);
  }

//eventually make this show who's stream you're looking at
  // onMarkerPressed() {
  //   this.props.navigator.push({
  //     sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
  //     component: PhotosView
  //   });
  // }

  render() {
    return (
      <View >
        <View style={styles.stream}>
        </View>
      </View>
    );
  }
};

var styles = StyleSheet.create({
  stream: {
    width: 215,
    height: 215,
    borderRadius: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#13878f',
  }
});

module.exports = StreamMarker;