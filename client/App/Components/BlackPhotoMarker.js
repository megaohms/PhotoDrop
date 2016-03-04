var React = require('react-native');
var MapView = require('react-native-maps');
var IconIon = require('react-native-vector-icons/Ionicons');
var PhotosView = require('./PhotosView');

var {
  Navigator,
  StyleSheet,
  View,
  Text,
} = React;

class BlackPhotoMarker extends React.Component{
  constructor(props){
    super(props);
    // this.state = {
    //   isStreamed: false
    // }
    // props.currentStream.forEach((streamedPhoto) => {
    //   if(streamedPhoto.url === this.props.id) {
    //     setState({isStreamed: true});
    //   }
    // })
  }


  render() {
    return (
      <View style={styles.container}>
        <View style={styles.bubble}>
          <View style={styles.icon}>
            {
              // this.state.isStreamed 
              // ? <IconIon name="waterdrop" size={25} color="#9CEDCE"/> 
              // :
            }
               <IconIon name="camera" size={25} color="#ededed"/>
          </View>
        </View>
        <View style={styles.arrowBorder} />
        <View style={styles.arrow} />
      </View>
    );
  }
};

var styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignSelf: 'flex-start'
  },
  bubble: {
    flex: 0,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#565b5c',
    borderRadius: 30,
    borderColor: 'grey',
  },
  icon: {
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    paddingBottom: 5,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderWidth: 15,
    borderColor: 'transparent',
    borderTopColor: '#565b5c',
    alignSelf: 'center',
    marginTop: -14.5
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: 'grey',
    alignSelf: 'center',
    marginTop: -0.5
  }
});

module.exports = BlackPhotoMarker;