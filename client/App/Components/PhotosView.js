var React = require('react-native');
var NavigationBar = require('react-native-navbar');
var _ = require('lodash');
var api = require('../Utils/api');
var IconIon = require('react-native-vector-icons/Ionicons');
var PhotoSwiperView = require('./PhotoSwiperView');

/*
  The big picture for favorites photos:
  
  Needs a api.fetchUserFavorites function to grab the favorites.

  Uses the api.fetchUserFavorites, and sets the this.state.userFavoritesUrls to the photosArr.

  _onChange() -> the imageUrls image is this.setState => imageUrls: this.state.userFavoritesUrls

  _onRefresh() -> sets api.fetchUserFavorites sets -> this.setState({ userFavoritesUrls: photosArr });
      else if(this.state.selectedIndex===1) {
        this.setState({imageUrls: this.state.userFavoritesUrls});
        
*/

var {
  Navigator,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicatorIOS,
  StatusBarIOS,
  TouchableHighlight,
  SegmentedControlIOS,
  RefreshControl,
} = React;

var {width, height} = Dimensions.get('window');
var IMAGES_PER_ROW = 3

class PhotosView extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      currentScreenWidth: width,
      currentScreenHeight: height,
      imageUrls: undefined,
      userId: this.props.route.userId,
      previousComponent: this.props.route.previousComponent,
      latitude: this.props.route.latitude,
      longitude: this.props.route.longitude,
      statusBarHidden: false,
      favorites: this.props.route.favorites,
      streams: this.props.route.streams,
      selectedIndex: 0,
      userPhotosUrls: undefined,
      userFavoritesUrls: undefined,
      // NEW: Add a streams Url, to add in the collection of Url of streams
      userStreamsUrls: undefined,
      allViewablePhotos: undefined,
      isRefreshing: false,
    };
      if(this.state.favorites) {
        api.fetchUserFavorites(this.state.userId, (photos) => {
          var photosArr = JSON.parse(photos);
          this.setState({ userFavoritesUrls: photosArr });
        })
        api.fetchUserPhotos(this.state.userId, (photos) => {
          var photosArr = JSON.parse(photos);
          var photosUrls = photosArr.map((photo) => {
            return photo.url;
          });
          this.setState({ imageUrls: photosUrls });
          this.setState({ userPhotosUrls: photosUrls });
        })
      } 
      if ( true ) {
      // NEW: grab streams photos
      // TODO: needs a function in api called api.fetchUserStreams
      // set the userStreamsUrls as the collection of photos
      api.fetchUserStreams(this.state.userId, (photos) => {
        var photosArr = JSON.parse(photos);
        console.log(photosArr); 
        this.setState({ userStreamsUrls: photosArr });
        console.log(this.state.userStreamsUrls);
      })
      api.fetchUserPhotos(this.state.userId, (photos) => {
        var photosArr = JSON.parse(photos);
        var photosUrls = photosArr.map((photo) => {
          return photo.url;
        });
        this.setState({ imageUrls: photosUrls });
        this.setState({ userPhotosUrls: photosUrls });
      })
    } else {
      navigator.geolocation.getCurrentPosition(
        location => {
          this.setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      );
      api.fetchPhotos(this.state.latitude, this.state.longitude, 50, (photos) => { // need to pass in the radius (in m) from the MapView; hardcoding as 50m for now
        var photosArr = JSON.parse(photos);
        var photosUrls = photosArr.map((photo) => {
          return photo.url;
        });
        this.setState({ imageUrls: photosUrls });
      })
    }
  }

  componentDidMount() {
    if(this.state.favorites || this.state.streams){
      this.setState({ imageUrls: this.state.userPhotosUrls});
    // } else if(this.state.streams){
    //   this.setState({ imageUrls: this.state.userPhotosUrls});
    } else {
      this.setState({ imageUrls: this.state.allViewablePhotos});
    }
  }

  componentWillUnmount() {
    if(this.state.previousComponent==='settings') {StatusBarIOS.setHidden(false);}
    if(this.state.previousComponent==='map') {StatusBarIOS.setHidden(true);}
  }

  handleRotation(event) {
    var layout = event.nativeEvent.layout;
    this.setState({ currentScreenWidth: layout.width, currentScreenHeight: layout.height });
  }

  calculatedSize() {
    var size = this.state.currentScreenWidth / IMAGES_PER_ROW;
    return { width: size, height: size };
  }

  // function that returns a function that knows the correct uri to render
  showImageFullscreen(uri, index) {
    return () => {
      this.setState({statusBarHidden: true});
      this.props.navigator.push({
        component: PhotoSwiperView,
        index: index,
        photos: this.state.imageUrls,
        // uri: uri,
        // width: this.state.currentScreenWidth,
        showStatusBar: this.showStatusBar.bind(this),
        userId: this.state.userId,
        sceneConfig: {
          ...Navigator.SceneConfigs.FloatFromBottom,
          gestures: {
            pop: {
              ...Navigator.SceneConfigs.FloatFromBottom.gestures.pop,
              edgeHitWidth: Dimensions.get('window').height,
            },
          },
        }
      });
    }
  }

  showStatusBar() {
    this.setState({statusBarHidden: false});
  }

  renderRow(images) {
    return images.map((uri, index) => {
      return (
        // Hardcoded key value for each element below to dismiss eror message
        <TouchableHighlight key={index} onPress={this.showImageFullscreen(uri, index)}>
          <Image key={index} style={[styles.image, this.calculatedSize()]} source={{uri: uri}} />
        </TouchableHighlight>
      )
    })
  }

  renderImagesInGroupsOf(count) {
    return _.chunk(IMAGE_URLS, IMAGES_PER_ROW).map((imagesForRow, index) => {
      return (
        <View style={styles.row} key={index}>
          {this.renderRow(imagesForRow)}
        </View>
      )
    })
  }

  _backButton() {
    this.props.navigator.pop();
  }

  _onChange(event) {
    this.setState({
      selectedIndex: event.nativeEvent.selectedSegmentIndex,
    });
    if(event.nativeEvent.selectedSegmentIndex===0) {
        this.setState({ imageUrls: this.state.userPhotosUrls});
    } else if(event.nativeEvent.selectedSegmentIndex===1) {
        this.setState({ imageUrls: this.state.userFavoritesUrls});
        // NEW: Add the streams imageUrls
    } else if(event.nativeEvent.selectedSegmentIndex===2) {
        this.setState({ imageUrls: this.state.userStreamsUrls});
    }
  }

  _onRefresh() {
    this.setState({isRefreshing: true});
    if(this.state.favorites) {
      api.fetchUserFavorites(this.state.userId, (photos) => {
        var photosArr = JSON.parse(photos);
        this.setState({ userFavoritesUrls: photosArr });
      })
      api.fetchUserPhotos(this.state.userId, (photos) => {
        var photosArr = JSON.parse(photos);
        var photosUrls = photosArr.map((photo) => {
          return photo.url;
        });
        // this.setState({ imageUrls: photosUrls });
        this.setState({ userPhotosUrls: photosUrls });
      })
      if(this.state.selectedIndex===0) {
        this.setState({imageUrls: this.state.userPhotosUrls});
      } else if(this.state.selectedIndex===1) {
        this.setState({imageUrls: this.state.userFavoritesUrls});
        // NEW: Add stream imageUrls selection here
      } else if(this.state.selectedIndex===2) {
        this.setState({imageUrls: this.state.userStreamsUrls});
      }
    } else {
      navigator.geolocation.getCurrentPosition(
        location => {
          this.setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      );
      api.fetchPhotos(this.state.latitude, this.state.longitude, 50, (photos) => { // need to pass in the radius (in m) from the MapView; hardcoding as 50m for now
        var photosArr = JSON.parse(photos);
        var photosUrls = photosArr.map((photo) => {
          return photo.url;
        });
        this.setState({ imageUrls: photosUrls });
      })
    }
    setTimeout(() => {
      this.setState({
        isRefreshing: false,
      });

    }, 1000);
  }

  render() {
    // MAYBE: Do I need to add a this.state.streams here to render in the <TEXT></TEXT>? 
    var pageTitle = (
       this.state.favorites ? <Text style={styles.pageTitle}>Your Photos</Text> : <Text style={styles.pageTitle}>Photos Near You</Text>
    )
    var backButton = (
      <TouchableHighlight onPress={this._backButton.bind(this)} underlayColor={'white'}>
        <IconIon name='ios-arrow-thin-down' size={30} style={styles.backIcon} color="#FF5A5F"/>
      </TouchableHighlight>
    );
    if(this.state.favorites) {
      return (
        <View style={{flex: 1, backgroundColor: '#ededed' }}>
          <NavigationBar 
            title={pageTitle} 
            tintColor={"white"} 
            statusBar={{hidden: this.state.statusBarHidden}}
            leftButton={backButton}/>
          <SegmentedControlIOS 
            values={['Uploaded By You', 'Favorited', 'Streams']} 
            selectedIndex={this.state.selectedIndex} 
            style={styles.segments} 
            tintColor="#FF5A5F"
            onChange={this._onChange.bind(this)}/>
          {this.state.imageUrls ? null : <ActivityIndicatorIOS size={'large'} style={[styles.centering, {height: 550}]} />}
          {this.state.imageUrls && this.state.selectedIndex===0 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText}>{`Looks like you haven't taken any photos...`}</Text>   : null}
          {this.state.imageUrls && this.state.selectedIndex===0 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText2}>Swipe to the camera and drop a photo!</Text>  : null}
          
          {this.state.imageUrls && this.state.selectedIndex===1 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText}>Looks like you have no favorite photos...</Text>   : null}
          {this.state.imageUrls && this.state.selectedIndex===1 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText2}>Swipe to the map and checkout photos around you!</Text>  : null}

          {this.state.imageUrls && this.state.selectedIndex===2 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText}>Looks like you have no streams photos...</Text>   : null}
          {this.state.imageUrls && this.state.selectedIndex===2 && !this.state.imageUrls.length ? <Text style={styles.noPhotosText2}>Swipe to the map and checkout photos around you!</Text>  : null}
          
          

          <ScrollView 
            onLayout={this.handleRotation.bind(this)} 
            contentContainerStyle={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this._onRefresh.bind(this)}
                title="Refreshing..."
              />
            }>
            {this.state.imageUrls ? this.renderRow(this.state.imageUrls) : null}
          </ScrollView>
        </View>
      ); 
    } else {
      return (
        <View style={{flex: 1, backgroundColor: '#ededed' }}>
          <NavigationBar 
            title={pageTitle} 
            tintColor={"white"} 
            statusBar={{hidden: this.state.statusBarHidden}}
            leftButton={backButton}/>
          {this.state.imageUrls ? null : <ActivityIndicatorIOS size={'large'} style={[styles.centering, {height: 550}]} />}
          {this.state.imageUrls && !this.state.imageUrls.length  ? <Text style={styles.noPhotosText}>Looks like there are no photos near you...</Text>   : null}
          {this.state.imageUrls && !this.state.imageUrls.length  ? <Text style={styles.noPhotosText2}>Be the first one to drop a photo!</Text>  : null}
          
          
          <ScrollView 
            onLayout={this.handleRotation.bind(this)} 
            contentContainerStyle={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this._onRefresh.bind(this)}
                title="Refreshing..."
              />
            }>
            {this.state.imageUrls ? this.renderRow(this.state.imageUrls) : null}
          </ScrollView>
        </View>
      ); 
    }
  }
}

var styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  noPhotosText: {
    marginTop: 65,
    fontSize: 16,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#656565',
    fontFamily: 'circular'
  },
  noPhotosText2: {
    fontSize: 16,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#656565',
    fontFamily: 'circular'
  },
  scrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  image: {
    borderWidth: 1,
    borderColor: '#fff'
  },
  backIcon: {
    marginLeft: 15,
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'circular',
    textAlign: 'center',
    color: '#565b5c'
  },
});

module.exports = PhotosView;