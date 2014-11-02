
import SocketServer
import json
import gensim
import nltk
from gensim import corpora, models, similarities
import pymongo
import pdb
from nltk.stem.wordnet import WordNetLemmatizer
import unicodedata
import re
from util import sortEnumeratedList 


class Dictionary:
    def __init__(self):
        f = open('/usr/share/dict/words', 'r')
        self.words = {}
        i = 0
        for line in f:
            self.words[line.strip('\n')] = i
            i = i + 1
        self.count = i
        f.close()


class CorpusMongo:
    def findTopThreeMatches(self, sims):
        enmd = list(enumerate(sims))
        enmd = sortEnumeratedList(enmd)
        i = 0
        vec = []
        retrel = {}
        print str(enmd[0][0]) + " | " + str(enmd[1][0]) + " | " + str(enmd[2][0]) + " | "
        for idea in self.ideas.find():
            if (i == enmd[0][0]):
                retrel['_id'] = idea['_id']
                retrel['weight'] = str(enmd[0][1])
                retrel['reviewed'] = '1'
                vec.append(retrel)
            elif (i == enmd[1][0]):
                retrel['_id'] = idea['_id']
                retrel['weight'] = str(enmd[1][1])
                retrel['reviewed'] = '1'
                vec.append(retrel)
            elif (i == enmd[2][0]):
                retrel['_id'] = idea['_id']
                retrel['weight'] = str(enmd[2][1])
                retrel['reviewed'] = '1'
                vec.append(retrel)
            retrel = {}
            i = i + 1
        print i
        print str(vec[0]) + " | " + str(vec[1]) + " | " + str(vec[2])
        return vec

    '''
        Relation (abcddf123:(weight:1, reviewed:1))
    '''


    def __init__(self):
        print 'Creating corpus of documents'
        self.Dic = Dictionary()
        lmtzr = WordNetLemmatizer()
        
        self.con = pymongo.Connection(host='127.0.0.1', port=3001)
        self.db = self.con['meteor']
        self.ideas = self.db.ideas
        self.vector = []
        i = 0
        for idea in self.ideas.find():
            if i < 3:
            #Get line
                line = idea['text']
                line = str(unicodedata.normalize('NFKD', line).encode('ascii','ignore'))
                #Strip of special characters
                line = re.sub(r'[^a-z^A-Z^0-9^,^.]|\^', ' ', line)
                line = line.lower()
                
                wordcount = {}
                
                for word in line.split(' '):
                    word = lmtzr.lemmatize(word)
                    
                    if isinstance(word, unicode):
                        word = str(unicodedata.normalize('NFKD', word).encode('ascii','ignore'))

                    if word in self.Dic.words.keys():
                        num = self.Dic.words[word]
                    else:
                        self.Dic.words[word] = self.Dic.count
                        num = self.Dic.count
                        self.Dic.count += 1
                    
                    if num not in wordcount.keys():
                        wordcount[num] = 1
                    else:
                        wordcount[num] = wordcount[num] + 1
                i = i + 1
            else:
                i = i + 1
                
            
            vec = []
            for key in wordcount.keys():
                tp =  (key, wordcount[key] + 0.0)
                vec.append(tp)
            
            self.vector.append(vec)
            self.ndic = self.Dic.count-1
        
        print 'Done creating corpus of documents'
        #print self.corpus

    def convertToVec(self, line):
        lmtzr = WordNetLemmatizer()
        if isinstance(line, unicode):
            line = str(unicodedata.normalize('NFKD', line).encode('ascii','ignore'))
        #Strip of special characters
        line = re.sub(r'[^a-z^A-Z^0-9^,^.]|\^', ' ', line)
        line = line.lower()
        wordcount = {}
        count = self.Dic.count

        for word in line.split(' '):
            word = lmtzr.lemmatize(word)
            if isinstance(word, unicode):
                word = str(unicodedata.normalize('NFKD', word).encode('ascii','ignore'))
            if word in self.Dic.words.keys():
                num = self.Dic.words[word]
            else:               
                num = count
                count += 1
            if num not in wordcount.keys():
                wordcount[num] = 1
            else:
                wordcount[num] = wordcount[num] + 1
        
        vec = []
        for key in wordcount.keys():
            tp = (key, wordcount[key] + 0.0)
            vec.append(tp)
        return vec


class MyTCPServer(SocketServer.ThreadingTCPServer):
    allow_reuse_address = True

class MyTCPServerHandler(SocketServer.BaseRequestHandler):
    def handle(self):
        try:
            print "Received data ... processing"
            data = (self.request.recv(1024).decode('UTF-8'))
            # process the data, i.e. print it:
            #data = (self.request.recv(1024).decode('UTF-8')).strip()
            json_data = json.loads(data);
            content = json_data['content']
            vec = myclass._corpus.convertToVec(content)
            sims = _index[_tfidf[vec]]
            
            vec = myclass._corpus.findTopThreeMatches(sims)
            
            #x = json.dumps(vec[0])
            rstr = json.dumps({ '0' : json.dumps(vec[0]), '1' : json.dumps(vec[1]), '2' : json.dumps(vec[2]) })
            print rstr

            #dic = { 'obj1' : json.dumps(vec[0]), 'obj2' : json.dumps(vec[1]), 'obj3': (vec[2]) }
            #rstr = json.dumps(vec[0])

            self.request.sendall(rstr);
            #self.request.sendall(sims);
        except Exception as e:
            print("Exception wile receiving message: ", e)

class MyClass:
    def __init__(self):
        self._corpus = CorpusMongo()
        self._tfidf = models.TfidfModel(self._corpus.vector)
        self._index = similarities.SparseMatrixSimilarity(self._tfidf[self._corpus.vector], num_features=self._corpus.ndic)

myclass = MyClass()


import json
from bson import json_util
from bson.objectid import ObjectId
from flask import Flask, request
from mongokit import Document
from flask.ext.pymongo import PyMongo
import datetime

app = Flask(__name__)
app.config['MONGO_HOST'] = 'localhost'
app.config['MONGO_PORT'] = 3001
app.config['MONGO_DBNAME'] = 'meteor'
mongo = PyMongo(app)

class Idea(Document):
    structure = {
        'text':unicode,
        'parent_id': unicode,
        'date_created': datetime.datetime,
        'status': int, # open, pending, rejected, filled
        'suggested_relations': [],
        'related_ideas': {},
    }
    required_fields = ['text', 'parent_id', 'date_created', 'status']
    default_values = {'text': u'', 'parent_id': u'', 'date_created': datetime.datetime.utcnow, 'status': 0}

class Relation(Document):
    structure = {
        #'_id': unicode,
        'text': unicode,
        'source_id': unicode,
        'target_id': unicode,
        'weight': float,
        'manmade': bool,
        'confirms': int,
        'denies': int,
    }
    required_fields = ['text']
    default_values = {'confirms': 0, 'denies': 0}

@app.route("/")
def show_entries():
    return ' ,'.join(mongo.cx.database_names())
# create read update delete
@app.route("/create_idea")
def create_idea():
    text = request.args.get("text")
    parent_id = request.args.get("parent_id")
    status = request.args.get("status", 0)
    if text == None:
        return 'Must specify text to create an idea!'
    entry = Idea()
    entry['text'] = text
    entry['parent_id'] = parent_id
    entry['status'] = status
    ideas = mongo.db.ideas
    idea_id = ideas.insert(entry)

    return text #'Done'

@app.route("/compute_suggested_relations")
def compute_suggested_relations():
    text = request.args.get("text")
    parent_id = request.args.get("parent_id")
    status = request.args.get("status", 0)
    if text == None:
        return 'Must specify text to create an idea!'

    #json_data = json.loads(text);
    #content = json_data['content']
    print "1"
    vec = myclass._corpus.convertToVec(text)
    print "2"
    print vec, text
    print myclass._tfidf[vec]
    sims = myclass._index[myclass._tfidf[vec]]
    print "3"
    vec = myclass._corpus.findTopThreeMatches(sims)
    print "4"
    rstr = json.dumps({ '0' : json.dumps(vec[0]), '1' : json.dumps(vec[1]), '2' : json.dumps(vec[2]) })
    print "5"
    return 'jsonpCallback({"results":' + rstr + '});'



    # entry = Idea()
    # entry['text'] = text
    # entry['parent_id'] = parent_id
    # entry['status'] = status
    # ideas = mongo.db.ideas
    # idea_id = ideas.insert(entry)

    # return text #'Done'


@app.route("/delete_idea") #args: idea_id
def delete_idea():
    idea_id = request.args.get("idea_id")
    if idea_id == None:
        return "Must specify idea_id to delete"
    mongo.db.relations.find_and_modify(
        query = {"_id": ObjectId(idea_id)},
        remove = True
    )
    return "Object deleted."
    

@app.route("/read_ideas")
def read_ideas():
    text = request.args.get("text")
    if text == None:
        cursor = mongo.db.ideas.find({})
    else:
        cursor = mongo.db.ideas.find({"text": text})
    return multipleToJson(cursor)

@app.route("/add_suggested_relation") #args: idea_id, relation_id
def add_suggested_relation():
    idea_id = request.args.get("idea_id")
    relation_id = request.args.get("relation_id")
    idea = mongo.db.ideas.find_and_modify(
        query = {"_id": ObjectId(idea_id)},
        update = {"$addToSet": {"suggested_relations": relation_id}},
        new = True
    )
    return toJson(idea)


@app.route("/read_relations")
def read_relations():
    relation_id = request.args.get("relation_id")
    if relation_id == None:
        cursor = mongo.db.relations.find({})
    else:
        cursor = mongo.db.relations.find({"_id": ObjectId(relation_id)})
    return multipleToJson(cursor)

@app.route("/create_relation") #arguments: text, strength, source, target, manmade
def create_relation():
    text = request.args.get("text")
    strength = request.args.get("strength", 0)
    source_id = request.args.get("source_id")
    target_id = request.args.get("target_id")

    if text == None:
        return 'Cannot insert relation with no text'
    entry = Relation()
    entry['text'] = text
    entry['strength'] = strength
    entry['source_id'] = source_id
    entry['target_id'] = target_id
    entry['manmade'] = True

    relations = mongo.db.relations
    relation_id = relations.insert(entry)

    return text #'Done'

@app.route("/get_suggested_relations") #arguments: idea_id
def get_suggested_relations():
    idea_id = request.args.get("idea_id")
    idea = mongo.db.ideas.find_one({"_id": ObjectId(idea_id)})
    suggested_relations = idea['suggested_relations']
    print suggested_relations
    return toJson(suggested_relations)

def auto_suggest_relations(): #argument: text
    suggested_relation = mongo.db.relations.find_one()
    return suggested_relation

@app.route("/relation_feedback")
def relation_feedback(): #arguments: relation_id, confirm, deny, user
    relation_id = request.args.get("relation_id")
    if not relation_id:
        return "No relation id given."
    confirm = request.args.get("confirm", False)
    deny = request.args.get("deny", False)
    user = request.args.get("user")

    confirm_increment = 0
    deny_increment = 0
    if confirm:
        confirm_increment = 1
    if deny:
        deny_increment = 1

    relation = mongo.db.relations.find_and_modify(
        query = {"_id": ObjectId(relation_id)},
        update = {"$inc": {"confirms": confirm_increment, "denies": deny_increment}},
        new = True
    )
    return toJson(relation)

def toJson(data):
    """Convert Mongo object(s) to JSON"""
    return json.dumps(data, default=json_util.default)

def multipleToJson(cursor):
    json_results = []
    for result in cursor:
      json_results.append(result)
    return toJson(json_results)


if __name__ == "__main__":
    app.run (debug=True)


