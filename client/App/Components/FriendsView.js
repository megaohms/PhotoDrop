var React = require('react-native');
var NavigationBar = require('react-native-navbar');
var _ = require('lodash');
var api = require('../Utils/api');
var Icon = require('react-native-vector-icons/FontAwesome');
var IconIon = require('react-native-vector-icons/Ionicons');
var SearchBar = require('react-native-search-bar');
var PhotoSwiperView = require('./PhotoSwiperView');

var {
  Navigator,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicatorIOS,
  StatusBarIOS,
  TouchableHighlight,
  SegmentedControlIOS,
  RefreshControl,
} = React;

var {width, height} = Dimensions.get('window');
var IMAGES_PER_ROW = 3

class FriendsView extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.route.userId,
      previousComponent: this.props.route.previousComponent,
      statusBarHidden: false,
      friends: [],
      selectedIndex: 0,
      userPhotosUrls: undefined,
      userFavoritesUrls: undefined,
      allViewablePhotos: undefined,
      isRefreshing: false,
      searchInput: undefined,
      foundUsers: []
    };
  }

  componentDidMount() {
    this.refs.searchBar.focus();
    api.fetchUserFriends(this.state.userId, (friends) => {
      var friends = JSON.parse(friends)
      this.setState({
        friends: friends
      })
    })
  }

  componentWillUnmount() {
    if(this.state.previousComponent==='settings') {StatusBarIOS.setHidden(false);}
  }

  handleSearchInput(event) {
    this.setState({
      searchInput: event.nativeEvent.text
    });
  }

  searchForUser() {
    api.fetchUsersBySearchInput(this.state.searchInput, (foundUsers) => {
      foundUsers = JSON.parse(foundUsers)

      // Remove signed in user from foundUser results
      _.each(foundUsers, (user, i) => {
        if (user._id === this.state.userId)
          foundUsers.splice(i, 1);
      })

      this.setState({
        foundUsers: foundUsers
      })
    });
  }

  addFriend(friendId) {
    api.addFriend(this.state.userId, friendId, (err, body) => {
      if (err) {
        console.error(err)
      } else {
        console.log('friend added');
      }
    })
  }

  showStatusBar() {
    this.setState({statusBarHidden: false});
  }

  renderFoundUsers(foundUsers) {
    return foundUsers.map((user, index) => {
      return (
        <View style={styles.foundUserRow} key={user._id}>
          <Text style={styles.foundUser}>{user.username}</Text>
          <TouchableHighlight onPress={() => {this.addFriend.bind(this)(user._id)}} style={styles.addFriendButton} underlayColor={'#FC9396'}>
            <IconIon name="ios-plus-empty" size={40} color="#FF5A5F" style={styles.addFriendIcon} />
          </TouchableHighlight>
        </View>
      )
    })
  }

  renderFriends() {
    return this.state.friends.map((friend, index) => {
      return (
        <View style={styles.foundUserRow} key={friend._id}>
          <Text style={styles.foundUser}>{friend.username}</Text>
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
  }

  _onRefresh() {
    this.setState({isRefreshing: true});

    setTimeout(() => {
      this.setState({
        isRefreshing: false,
      });

    }, 1000);
  }

  render() {
    var pageTitle = (
       <Text style={styles.pageTitle}>Friends</Text>
    )
    var backButton = (
      <TouchableHighlight onPress={this._backButton.bind(this)} underlayColor={'white'}>
        <IconIon name='ios-arrow-thin-down' size={30} style={styles.backIcon} color="#FF5A5F"/>
      </TouchableHighlight>
    );
    if(this.state.selectedIndex === 0) {
      return (
        <View style={{flex: 1, backgroundColor: '#ededed' }}>
          <NavigationBar 
            title={pageTitle} 
            tintColor={"white"} 
            statusBar={{hidden: this.state.statusBarHidden}}
            leftButton={backButton}/>
          <SegmentedControlIOS 
            values={['Find Friends', 'Your Friends']} 
            selectedIndex={this.state.selectedIndex} 
            style={styles.segments} 
            tintColor="#FF5A5F"
            onChange={this._onChange.bind(this)}/>
          {this.state.friends ? null : <ActivityIndicatorIOS size={'large'} style={[styles.refreshingIcon, {height: 550}]} />}
          
          <SearchBar 
            ref={'searchBar'}
            placeholder={'Search by username'}
            textFieldBackgroundColor={'white'}
            autoCapitalize={'none'}
            autoCorrect={false}
            returnKeyType={'go'}
            value={this.state.searchInput}
            onChange={this.handleSearchInput.bind(this)}
            onSubmitEditing={this.searchForUser.bind(this)}
          />

          <TextInput
            placeholder={'Search by username or phone number'}
            autoCapitalize={'none'}
            autoCorrect={false}
            maxLength={16}
            style={styles.userInput}
            returnKeyType={'go'}
            value={this.state.searchInput}
            onChange={this.handleSearchInput.bind(this)}
            onSubmitEditing={this.searchForUser.bind(this)}
          />
          <ScrollView 
            contentContainerStyle={styles.foundUserScrollView}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this._onRefresh.bind(this)}
                title="Refreshing..."
              />
            }>
            {this.renderFoundUsers(this.state.foundUsers)}
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
          <SegmentedControlIOS 
            values={['Find Friends', 'Your Friends']} 
            selectedIndex={this.state.selectedIndex} 
            style={styles.segments} 
            tintColor="#FF5A5F"
            onChange={this._onChange.bind(this)}/>
          {this.state.friends ? null : <ActivityIndicatorIOS size={'large'} style={[styles.refreshingIcon, {height: 550}]} />}
          
          <ScrollView 
            contentContainerStyle={styles.foundUserScrollView}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this._onRefresh.bind(this)}
                title="Refreshing..."
              />
            }>
            {this.renderFriends()}
          </ScrollView>

        </View>
      ); 
    }
  }
}

var styles = StyleSheet.create({
  backIcon: {
    marginLeft: 15,
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'circular',
    textAlign: 'center',
    color: '#565b5c'
  },
  refreshingIcon: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldTitle: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 18,
    fontFamily: 'circular',
    textAlign: 'center',
    color: '#616161'
  },
  userInput: {
    marginLeft: 30,
    marginRight: 30,
    padding: 5,
    height: 50,
    fontSize: 18,
    fontFamily: 'circular',
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 4,
    color: '#616161'
  },
  foundUserScrollView: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  foundUserRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#b0b0b0'
  },
  foundUser: {
    flex: 4,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 15,
    fontSize: 18,
    paddingLeft: 10,
    fontFamily: 'circular',
    textAlign: 'left',
    color: '#616161'
  },
  addFriendButton: {
    width: 50,
    height: 50,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 25,
    borderWidth: 2,
    margin: 10,
    borderColor: '#FF5A5F'
  },
  noFriendsText: {
    marginTop: 65,
    fontSize: 16,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#656565',
    fontFamily: 'circular'
  },
});

module.exports = FriendsView;