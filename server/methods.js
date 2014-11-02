Meteor.methods({

'ideaSearch': function(data) {
    console.log('ideaSearch');

    var limit = 25;
    data.other = {limit: limit}

    var retVal = [];

    retVal = Ideas.find(data.query, data.other).fetch();
    console.log(retVal.length)
    return _.sortBy(retVal, function(obj) {return obj.searchCache});
  },


'insertRelationBiServer':  function(src, target, relationship) {
    if (typeof relationship === 'undefined'){
        relationship = {weight:1,reviewed:true};
      }

      var newRelation ={}
      newRelation["relations."+target]=relationship

     Ideas.update({_id:src},{$set: newRelation})

     var newRelationBack ={}
     newRelationBack["relations."+src]=relationship
     Ideas.update({_id:target},{$set: newRelationBack}) 

	}
})