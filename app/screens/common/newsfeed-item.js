import React, {Component} from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
} from 'react-native';
import Placeholder from './placeholder';
import {STRINGS, CONSTANT_NUMS} from '../../assets/constants.js';
import styles from '../styles/newsfeeditem.js';
const h2p = require('html2plaintext')

const HTML = (props) => {
  return <Text style={props.style}>{h2p(props.html)}</Text>
}


const {width, height} = Dimensions.get('window');

export default class NewsFeedItem extends Component {
    constructor() {
        //Constructor saying everything is initially empty
        super();
        this._mounted = false;
        this.state = {
          author : "",
          date : "",
          title : "",
          featuredMedia : "",
          description: "",
          loaded: false
        };
    }

    //When the item is about to be mounted, we fetch the data about this article from the server
    componentWillMount() {
      this.fetchData();
    }

    //Indicator saying that the item is now being displayed
    componentDidMount() {
      this._mounted = true;
    }

    //Indicator saying that the item was took off the screen
    componentWillUnmount() {
      this._mounted = false;
    }

    //Given a UTC formated date from the WP object, returns a date string in the expected mm/dd/yyyy format
    assembleDate(dateObj) {
      var dt = new Date(dateObj);
      var month = dt.getUTCMonth();
      var day = dt.getUTCDate();
      var year = dt.getUTCFullYear();
      return month+1 + '/' + day + '/' + year;
    }

    chooseMediaSize = async () => {
      try {
        var featuredMedia = ""; //We assume that there is no featured media till we find one
        // console.warn(this.props.data.postObj.title.rendered + " " + this.props.data.postObj.featured_media);
        if(this.props.data.postObj.featured_media !== 0) {
          let featuredMediaResponse = await fetch(STRINGS.MEDIA_URL + this.props.data.postObj.featured_media);
          let featuredMediaData = await featuredMediaResponse.json();
          if(width > CONSTANT_NUMS.PHONE_MAX_WIDTH) {
            if(featuredMediaData.media_details.sizes["big-slider"] !== undefined) {
              featuredMedia = featuredMediaData.media_details.sizes["big-slider"].source_url;
            } else {
              featuredMedia = featuredMediaData.source_url;
            }
          } else {
            if(featuredMediaData.media_details.sizes.medium_large !== undefined) {
              featuredMedia = featuredMediaData.media_details.sizes.medium_large.source_url;
            } else if (featuredMediaData.media_details.sizes.large !== undefined) {
              featuredMedia = featuredMediaData.media_details.sizes.large.source_url;
            } else if (featuredMediaData.media_details.sizes.medium !== undefined) {
              featuredMedia = featuredMediaData.media_details.sizes.medium.source_url;
            } else {
              featuredMedia = featuredMediaData.source_url;
            }
          }
        }
        return featuredMedia;
      } catch (exception) {
        return "";
      }
    }

    //Async fetch data from the WP server
    async fetchData() {
        let authorResponse = await fetch(this.props.data.postObj._links.author[0].href); //A reguest to get author info
        let authorData = await authorResponse.json(); //Author info JSON
        var author = authorData.name; //Author name
        var authorID = authorData.id;
        var date = this.assembleDate(this.props.data.postObj.date); //Gets date from the given response
        var title = this.props.data.postObj.title.rendered; //Gets title in HTML from the given response
        var description = this.props.data.postObj.excerpt.rendered; //Gets desc in HTML from the given response
        var featuredMedia = await this.chooseMediaSize();
        //Cutting the allowed number of characters for the desc
        var cut = this.props.context === STRINGS.HEADLINES ? CONSTANT_NUMS.SOFT_DESC_LIMIT : CONSTANT_NUMS.SOFT_SEARCH_DESC_LIMIT;
        var hardLimit = this.props.context === STRINGS.HEADLINES ? CONSTANT_NUMS.HARD_DESC_LIMIT : CONSTANT_NUMS.HARD_SEARCH_DESC_LIMIT;
        if (description.length > cut) {
          while(cut < hardLimit) {
            if(description.charAt(cut) === ' ') {
              break;
            }
            cut += 1;
          }
        }
        //If the item is displayed, and we have new data, put it up
        if(this._mounted) {
          this.setState({
            id: this.props.postID,
            author: author,
            authorID: authorID,
            date: date,
            title: title,
            featuredMedia: featuredMedia,
            description: description.substring(0,cut)+STRINGS.MORE_TEXT,
            body: this.props.data.postObj.content.rendered,
            loaded: true
          });
        }
    }

    //Handles clicking on items
    toPost() {
      this.props.onPress(this.state);
    }

    toAuthor() {
      this.props.onAuthorPress(this.state.authorID);
    }

    //Renders the view:
    //<Clickable to go to post>
    //  if featuredMedia exists, <Image of featured media/>
    // <Date and author/>
    // <Title as HTML Text/>
    // <Description as HTML/>
    //</Clickable>
    headlinesView() {
      if(this.state.loaded) {
        return (
          <TouchableWithoutFeedback onPress={this.toPost.bind(this)}>
            <View style={styles.content}>
            {this.state.featuredMedia !== "" && (
              <View style={styles.imageContainer}>
                <Image source={{uri: this.state.featuredMedia}} style={styles.image}/>
              </View>)
            }
            
              <View style={styles.dateAndAuthor}>
              <TouchableOpacity onPress = {()=>this.toAuthor()}>
                  <Text style={styles.author}> {this.state.author} </Text>
                  </TouchableOpacity>
                <Text style={styles.date}> {this.state.date} </Text>

              </View>
              <HTML style={styles.title} html={this.state.title}/>
              <HTML style={styles.description} html={this.state.description}/>
            </View>
          </TouchableWithoutFeedback>
        );
      }
      //If no content is loaded, put a placeholder
      return <Placeholder />;
    }

    searchView() {
      if(this.state.loaded) {
        return (
          <TouchableWithoutFeedback onPress={this.toPost.bind(this)}>
            <View style={styles.searchContainer}>
              <View style={[styles.searchContent, {flex: 1}]}>
                <View style={styles.searchDateAndAuthor}                >
                  <TouchableOpacity onPress = {()=>this.toAuthor()}>
                  <Text style={styles.author}> {this.state.author} </Text>
                  </TouchableOpacity>
                  <Text style={styles.date}> {this.state.date} </Text>
                  
                </View>
                <HTML style={styles.searchTitle} html={this.state.title}/>
                <HTML style={styles.searchDescription} html={this.state.description}/>
              </View>
              {this.state.featuredMedia !== "" &&
                  <Image source={{uri: this.state.featuredMedia}} style={styles.searchImage}/>
              }
            </View>
          </TouchableWithoutFeedback>
        );
      }
      return null;
    }

    renderContent() {
        if(this.props.context === STRINGS.SEARCH) {
          return this.searchView();
        } else {
          return this.headlinesView();
        }
    }

    render() {
        return (
            this.renderContent()
        )
    }
}
