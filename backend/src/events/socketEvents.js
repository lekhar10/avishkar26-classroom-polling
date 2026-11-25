module.exports = {
  CLIENT: {
    JOIN_ROOM: 'room:join',
    SUBMIT_VOTE: 'vote:submit',
    SUBMIT_QUESTION: 'question:submit',
    UPVOTE_QUESTION: 'question:upvote',
    CHANGE_POLL_STATUS: 'poll:status_change'
  },
  SERVER: {
    ROOM_JOINED: 'room:joined_success',
    ROOM_ERROR: 'room:error',
    VOTE_UPDATE: 'vote:live_stream',
    QUESTION_NEW: 'question:new_item',
    QUESTION_UPDATE: 'question:item_changed',
    POLL_UPDATE: 'poll:state_changed'
  }
};
