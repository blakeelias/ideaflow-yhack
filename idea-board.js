
  // path: '/posts/:file(*)'
  /*
  Router.map(function() {
    // Home Route
    this.route('home', {path: '/'}); 

    */


Router.route('/', function(){
    this.redirect('/idea/')
});

Router.route('/idea/:slug*', function() {
    var current_idea;
    if(!this.params.slug) {
      current_idea = {_id:null,slug: null}
    } else {
      var path = this.params.slug.replace(/\/$/, '').split("/");
      
      var idea_slug = path[path.length-1];
      
      current_idea = Ideas.findOne({slug: idea_slug});
    }
    Session.set("current_view", this.params.query.graph !== undefined? 'graph' : 'list')
    Session.set("current_idea", current_idea);
    this.render('idea_board')

});


// Router.route('/idea/:slug*', function() {
//   this.redirect('/idea/' + this.params.slug + '/')
// });

/*
Router.route('/idea/:_id(*)', function () {
  var path = this.params._id.split("/");
  console.log(path)
  var idea_id = path[path.length-1];
  var idea = Items.findOne({_id: idea_id});
  Session.set("current_idea", idea);
  this.render('idea_board');
});*/




  if (Meteor.isClient) {

    Session.setDefault("current_idea", {_id: null});
    Session.setDefault("current_view", "list");
    Session.setDefault("importShow", false);


    var ideaHelpers={
      formatDate: function() {
        return moment(this.date_created).format('MMM Do, YYYY');
      },

      bolded_text: function() {
        text = this.text;
        search_input = Session.get("search_input");
        if (search_input) {
          text = text.replace(new RegExp('<b>', 'gi'), '');
          text = text.replace(new RegExp('</b>', 'gi'), '');
          text = text.replace(new RegExp("(" + search_input + ")", 'gi'), '<b>$1</b>');
        }
        return text;
      },
      splitted: function() {
        if (this.text !== undefined) {
          delims = ['--',':'];
          titleTxt = this.text.substr(0,80);
          for(i in delims) {
            titleTxt= Txt.substr(0,indexOf(delims[i]));
          }

          return {
            title: titleTxt,
            nontitle: this.text.substr(titleTxt.length)
          };
        }
      },

      hidden: function() {
        return this.hidden;
      },

      title: function() {
        splitted = Template.idea.splitted();
      if (splitted !== undefined) {
        return splitted[0];
      }
    },

    relations: function() {
      return _.map(this.relations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        return {targetIdea:relation , weight: val.weight};
      });
    },
    manuallyReviewedRelations: function() {

      var manuallyReviewedRelations={}
      for (key in this.relations) {
          if (this.relations[key].reviewed)
            manuallyReviewedRelations[key] = this.relations[key];
      }

      return _.map(manuallyReviewedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        // console.log(manuallyReviewedRelations);
        return {targetIdea:relation , weight: val.weight, reviewed:val.reviewed};
      });
    },    

    suggestedRelations: function() {
      var reviewedRelations={}
      for (key in this.relations) {
          if (!this.relations[key].reviewed)
            reviewedRelations[key] = this.relations[key];
      }

      return _.map(reviewedRelations, function(val, key) {
        var relation=Ideas.findOne({_id:key});
        return {targetIdea:relation , weight: val.weight, reviewed:val.reviewed};
      });
    },

    expandedIdeas: function() {
      return Template.instance().expandedIdeas.get();
    }
  }



  
  Template.idea.helpers(ideaHelpers)

  //#future #refactor
  var relationHelpers = ideaHelpers;
  relationHelpers.suggestedRelation=function() {
    return true;
  }
  // relationHelpers.expandedRelation=function(parentContext) {
  //   return parentContext.isExpanded(this.id)
  // }

  Template.relation.helpers(relationHelpers)

  Template.relation.events({

  'click .relation .deny': function(event) {
     var sourceId = Template.parentData(1)._id;

     var setReviewed ={}
     setReviewed["relations."+this.targetIdea._id+".reviewed"]=true;
     var oneDeny ={}
     oneDeny["relations."+this.targetIdea._id+".denies"]=1;

     Ideas.update({_id:sourceId},{$set: setReviewed, $inc:oneDeny})
     console.log(Ideas.findOne({_id:sourceId}))
      // Ideas.update({_id:this._id},{$set: {"relatedIdeas."+this.targetIdea._id: {reviewed:false}})

    },
  'click .relation .confirm': function(event) {
     var sourceId = Template.parentData(1)._id;

     var setReviewed ={}
     setReviewed["relations."+this.targetIdea._id+".reviewed"]=true;
     var oneConfirm ={}
     oneConfirm["relations."+this.targetIdea._id+".confirms"]=1;

     Ideas.update({_id:sourceId},{$set: setReviewed, $inc:oneConfirm})
     console.log(Ideas.findOne({_id:sourceId}))
    //   var $targetLink=$(event.target)
    //   var idToExpand=$targetLink.data("id");



    //   var expandedIdeas=Template.instance().expandedIdeas
    //   var expandedIdeasRay=expandedIdeas.get()

    //   var idExpanded=false
    //   var i 
    //   for( i = 0; i < expandedIdeasRay.length; i++){
    //     if(expandedIdeasRay[i]._id === idToExpand){
    //       idExpanded = true;
    //       break;
    //     }
    //   }

    //   if(idExpanded){

    //     $targetLink.parent().removeClass("expanded"); //#hack
    //     expandedIdeasRay.splice(i, 1);
    //     expandedIdeas.set(expandedIdeasRay);
    //   } else {
    //     $targetLink.parent().addClass("expanded"); //#hack
    //     expandedIdeasRay.unshift(Ideas.findOne({_id:idToExpand}));
    //     expandedIdeas.set(expandedIdeasRay);
    // }

  }
})

  Template.idea.created=function() {
    this.expandedIdeas=new ReactiveVar([]);
  }

  Template.idea.rendered=function() {
    
    //slideDown(1000);
  }

  Template.idea.events({
    'click .relation>a': function(event) {
      var $targetLink=$(event.target)
      var idToExpand=$targetLink.data("id");



      var expandedIdeas=Template.instance().expandedIdeas
      var expandedIdeasRay=expandedIdeas.get()

      var idExpanded=false
      var i 
      for( i = 0; i < expandedIdeasRay.length; i++){
        if(expandedIdeasRay[i]._id === idToExpand){
          idExpanded = true;
          break;
        }
      }

      if(idExpanded){

        $targetLink.parent().removeClass("expanded"); //#hack
        expandedIdeasRay.splice(i, 1);
        expandedIdeas.set(expandedIdeasRay);
      } else {
        $targetLink.parent().addClass("expanded"); //#hack
        expandedIdeasRay.unshift(Ideas.findOne({_id:idToExpand}));
        expandedIdeas.set(expandedIdeasRay);
    }

  },
    // 'click a': function(event) {
      // https://github.com/EventedMind/iron-location
      // history.pushState({}, '', $(event.target).attr("href"));
      // return false;

      //event.preventDefault();
      /* filter = Session.get("current_idea");
      filter = {};
      filter['parent_id'] = $(event.target).data("idea-id");
      Session.set("current_idea", filter); */
    // }
  })





  Template.idea_form.events({
    'submit': function(event) {
      event.preventDefault();
      $input = $('.idea_text'); 
      var ideaData = {
        text: $input.val().trim(),
        parent_id: Session.get("current_idea")["_id"], 
        date_created: new Date().getTime(),
        status: 0 // open, pending, rejected, filled
      };

      insertIdea(ideaData);

      $input.val('');
    }
  })

  Template.idea_board.created = function() {

    Deps.autorun(function() {
      // This find() can be any reactive datasource
      var ideas = Ideas.find(Session.get("current_idea")).fetch();

      // If the filter already exists just update the dataset
      if (typeof ideaFilter === 'object' && ideaFilter !== null) {
        ideaFilter.updateDataset('text', ideas);
      } 
      else {
        // Otherwise initialize the filter
        ideaFilter = new DatasetFilter({
                            dataset: ideas,
                            queryKey: 'text'
                    });
      }
    });
  }

  Template.idea_board.helpers({
    ideas: function() {
      var allIdeas = Ideas.find({parent_id: Session.get("current_idea")._id}, {sort: {date_created: -1}}).fetch();
      var allObjects = {};
      allIdeas.forEach(function(idea, i) {
        idea.children=Ideas.find({parent_id:idea._id}, {sort: {date_created: -1}}).fetch();
        idea.numChildren=idea.children.length;
        
        allObjects[idea._id] = i;
      });

      if (!Session.get('search_input')) {
        return allIdeas;
      }
      else {
        query = {parent_id: Session.get("current_idea")._id};
        query.text = {"$regex": new RegExp(Session.get("search_input"), 'i')}
        var searchedIdeas = Ideas.find(query, {sort: {date_created: -1}}).fetch();
        allIdeas.forEach(function(idea, i) {
          idea.hidden = 'hidden';
          allIdeas[i] = idea;

        });
        searchedIdeas.forEach(function(sidea) {
          var ideaIndex = allObjects[sidea._id];
          var idea = allIdeas[ideaIndex]; 
          idea.hidden = '';

          allIdeas[ideaIndex] = idea;

        });

        return allIdeas
      }
    },

    breadcrumb: function() {

      var breadcrumb=[];
      
      var currentIdeaIter=Session.get("current_idea");

      while(currentIdeaIter!==undefined && currentIdeaIter["_id"]!==null && currentIdeaIter["_id"] !== undefined) {
        breadcrumb.unshift(currentIdeaIter);

        var parentIdea=Ideas.findOne({_id:currentIdeaIter["parent_id"]});
        currentIdeaIter=parentIdea;
      } 

      breadcrumb.unshift({_id:null,slug:"",path:"/",title:"Root"});

      for(var i=1;i<breadcrumb.length;i++) {
        breadcrumb[i].path=breadcrumb[i-1].path+breadcrumb[i].slug+"/";
      }


      if(breadcrumb.length > 0) {
        breadcrumb[breadcrumb.length-1].last = true;
      }


      //for(var parent=Session.get("current_idea");parent!==null; parent=Ideas.find({_id:parent["parent_id"]})) {

      // }
      return breadcrumb;

      // if(parentIdea!==undefined) {
      //   return parentIdea.text.substr(0,50);
      // }
      // else {
      //   return "";
      // }
    },

    isListView: function() {
      return Session.get("current_view")!=="graph";
    },

    importShow: function() {
      return Session.get("importShow") ? "show" : "";
    }

  });

  Template.idea_board.events({
    'keyup': function () {
      // increment the counter when button is clicked
      Session.set("search_input", $('input[name=search]').val());
    },

    'a.breadcrumb click': function(){
      // history.pushState({}, '', $(event.target).attr("href"));
      // return false;
    }
    'a#import-link click': function(){
      Session.set("importShow",!Session.get("importShow"))
      // history.pushState({}, '', $(event.target).attr("href"));
      // return false;
    }
  });

  Template.graph.helpers({
    selected_idea: function(){
      return Session.get("selected_idea")
      return "323e092u34"
    }
  })


  Template.graph.rendered = function () {
    var svg, 
        width = 900, 
        height = 900;

    var mousedown_node;

    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("pointer-events", "none").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("pointer-events", "none").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }
    function zoom() {
      svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    svg = d3.select('#viz')
      .attr('width', width)
      .attr('height', height)
      .append("g")
        .call(d3.behavior.zoom().scaleExtent([0.1, 8]).on("zoom", zoom))
      .append("g")
    
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height);

    // line displayed when dragging new nodes
    var drag_line = svg.append('svg:path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0');

    var force = d3.layout.force();

    // define arrow markers for graph links
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#000');

    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', '#000');


    svg
      .on('mousemove', function(d){  
        // update drag line
        if(mousedown_node) {
          drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
        }
        
      })
      .on('mouseup', function(d){
        if(mousedown_node) {
          // hide drag line
          drag_line
            .classed('hidden', true)
            .style('marker-end', '');
          force.resume();

          mousedown_node = null;
        }
      })


    var fill = d3.scale.category10();
    // console.log(ideas)

    Tracker.autorun(function () {
      var id = Session.get("current_idea");
      if(!id) return;

      console.log(id, 'current idea id')
      var ideas = Ideas.find(
        { parent_id: id._id }, 
        {sort: {date_created: 1}}
      ).fetch();

      // #future for related ideas outside current scope
      // var related_ids = _.uniq(_.flatten(ideas.map(function(e){
      //   return Object.keys(e.relations)
      // })));

      // var related_ideas = Ideas.find({_id: {$in: related_ids}}).fetch();
      // console.log('related idea', related_ideas, related_ids);

      var indexmap = {};
      var data = ideas.map(function(e, i){
        indexmap[e._id] = i;
        return { index: i, weight: 1, idea: e, width: 50, height: 20 }
      });
      
      
      var links = _.flatten(ideas.map(function(idea, i){
        return Object.keys(idea.relations || {}).filter(function(relative){
          return relative in indexmap
        }).map(function(relative){
          return {
            source: i,
            target: indexmap[relative]
          }
        })
      }));


      function tick(e) {
        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // labels.attr("x", function(d) { return d.x; })
        //     .attr("y", function(d) { return d.y; });

        labels.attr("transform", function(d){
          return "translate(" + (d.x + 10) +"," + (d.y - 10) + ")"
        })

        link.attr("x1", function(d) { return d.source.x ; })
            .attr("y1", function(d) { return d.source.y ; })
            .attr("x2", function(d) { return d.target.x ; })
            .attr("y2", function(d) { return d.target.y ; });

      }

      force
        .distance(80)
        .charge(-400)
        .nodes(data)
        .links(links)
        .size([width, height])
        .on("tick", tick)
        // .resume()
        .start()

      
      var link = svg.selectAll(".link")
        .data(links);
      
      link.exit().remove();

      link
        .enter().append("line")
          .attr("class", "link");
      

      var node = svg.selectAll(".node")
        .data(data);

      node.exit().remove();

      node.enter().append("circle")
        .attr("class", "node")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d){ return d.width })
        .attr("height", function(d){ return d.height })
        .attr("r", 8)
        .style("fill", function(d, i) { return fill(i & 3); })
        .style("stroke", function(d, i) { return d3.rgb(fill(i & 3)).darker(2); })
        // .call(drag)
        .on('click', function(d){
          // console.log('onclick')
          // d3.select(this).classed("fixed", d.fixed = true);
          Session.set("selected_idea", d)
        })
        .on('mousedown', function(d){
          d3.event.stopPropagation()
          // console.log('mousing down')
          // reposition drag line
          mousedown_node = d;
          force.stop()

          drag_line
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
        })
        .on('mouseup', function(d){
          console.log('test test test test')
          if(mousedown_node && mousedown_node != d){
            // links.push({source: mousedown_node, target: d})
            // console.log('mousing up', mousedown_node, d) 
            var sourceId = mousedown_node.idea._id;
            var targetId = d.idea._id;

            var newRelation ={}
            newRelation["relations."+targetId]={weight:1,reviewed:true}

            Ideas.update({_id:sourceId},{$set: newRelation})
            var newRelationBack ={}
            newRelationBack["relations."+sourceId]={weight:1,reviewed:true}
            Ideas.update({_id:targetId},{$set: newRelationBack})     

          }
        })
        .on('mouseover', function(d){
          // console.log('mouse over', d)
          // var nodeSelection = d3.select(this).style({opacity:'0.8'});
          // nodeSelection.select("text").style({opacity:'1.0'});
          Session.set("selected_idea", d)
          d3.select(this).classed("focused", true)

        })
        .on('mouseout', function(d){
          d3.select(this).classed("focused", false)
          // Session.set("selected_idea", null);
        })
        
      var labels = svg.selectAll(".nodelabels")
        .data(data);

      labels.enter().append("text")
        .attr("class", "nodelabels")
        .attr("x", function(d) { return 0; })
        .attr("y", function(d) { return 0; })
        // .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("font-size", "9px")
        .attr("dy", ".71em")
        .text(function(d) {
            return d.idea.title;
        })
        .call(wrap, 100)

      labels.exit().remove();

      force.resume()


    });

    
    // https://gist.github.com/alx/5337474

 
    // sigma.publicPrototype.modulate = function() {
    //   if(!this.modularity) {
    //     var sigmaInstance = this;
    //     var mod = new Modularity(sigmaInstance._core);
    //     sigmaInstance.modularity = mod;
    //   }

    //   this.modularity.computeModularity();

    //   return this;
    // }
    


    // Circles.find().observe({
    //   added: function () {
    //     x = d3.scale.ordinal()
    //       .domain(d3.range(Circles.findOne().data.length))
    //       .rangePoints([0, width], 1);
    //     drawCircles(false);
    //   },
    //   changed: _.partial(drawCircles, true)
    // });
  }; 


  UI.registerHelper('addKeys', function (all) {
    return _.map(all, function(i, k) {
      return {key: k, value: i};
    });
  });

  function arrayEqual(a1, a2){
    _.isEmpty(_.difference(array1, array2))
  }
}


