var React = require('react-native');
var NavigationBar = require('react-native-navbar');
var _ = require('lodash');
var api = require('../Utils/api');
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
      isRefreshing: false,
      searchInput: undefined,
      foundUsers: []
    };
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

  addFoundUserAsFriend(friendId) {
    api.addFriend(this.state.userId, friendId, (err, body) => {
      if (err) {
        console.error(err)
      } else {
        console.log('friend added');
      }
    })
  }

  renderFoundUsers(foundUsers) {
    return foundUsers.map((user, index) => {
      return (
        <View style={styles.foundUserRow} key={user._id}>
          <Text style={styles.foundUser}>{user.username}</Text>
          <TouchableHighlight onPress={() => {this.addFoundUserAsFriend.bind(this)(user._id)}} style={styles.buttonBorder} underlayColor={'#FC9396'}>
            <IconIon name="ios-plus-empty" size={53} color="#FF5A5F" style={styles.addFriendIcon} />
          </TouchableHighlight>
        </View>
      )
    })
  }

  fetchUserFriends() {
    api.fetchUserFriends(this.state.userId, (friends) => {
      var friends = JSON.parse(friends)
      this.setState({
        friends: friends
      })
    })
  }

  renderFriends() {
    return this.state.friends.map((friend, index) => {
      return (
        <View style={styles.foundUserRow} key={friend._id}>
          <Text style={styles.foundUser}>{friend.username}</Text>
          <TouchableHighlight onPress={() => {}} style={styles.buttonBorder} underlayColor={'#FC9396'}>
            <IconIon name="ios-close-empty" size={53} color="#FF5A5F" style={styles.addFriendIcon} />
          </TouchableHighlight>
        </View>
      )
    }) 
  }

  componentDidMount() {
    this.refs.searchBar.focus();
    this.fetchUserFriends();
  }

  componentWillUnmount() {
    if(this.state.previousComponent==='settings') {StatusBarIOS.setHidden(false);}
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

    // selectedIndex: '0' displays Find Friends view and '1' displays Your Friends view
    if(this.state.selectedIndex === 0) {

      // Return 'Find Friends View'
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
            keyboardType={'default'}
            autoCapitalize={'none'}
            autoCorrect={false}
            returnKeyType={'default'}
            value={this.state.searchInput}
            onChange={this.handleSearchInput.bind(this)}
            onPress={this.searchForUser.bind(this)}
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

      // Return 'Your Friends' View
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
    fontSize: 24,
    paddingLeft: 20,
    fontFamily: 'circular',
    textAlign: 'left',
    color: '#616161'
  },
  buttonBorder: {
    width: 50,
    height: 50,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 35,
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