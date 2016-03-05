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
        <View style={styles.stream} />
      </View>
    );
  }
};

var styles = StyleSheet.create({
  stream: {
    borderRadius: 150,
    borderWidth: 2,
    borderColor: '#0C585E',
    borderStyle: 'dashed'
  }
});

module.exports = StreamMarker;