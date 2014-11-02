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

_corpus = CorpusMongo()
_tfidf = models.TfidfModel(_corpus.vector)
_index = similarities.SparseMatrixSimilarity(_tfidf[_corpus.vector], num_features=_corpus.ndic)

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
            vec = _corpus.convertToVec(content)
            sims = _index[_tfidf[vec]]
            
            vec = _corpus.findTopThreeMatches(sims)
            
            #x = json.dumps(vec[0])
            rstr = json.dumps({ '0' : json.dumps(vec[0]), '1' : json.dumps(vec[1]), '2' : json.dumps(vec[2]) })
            print rstr

            #dic = { 'obj1' : json.dumps(vec[0]), 'obj2' : json.dumps(vec[1]), 'obj3': (vec[2]) }
            #rstr = json.dumps(vec[0])

            self.request.sendall(rstr);
            #self.request.sendall(sims);
        except Exception as e:
            print("Exception wile receiving message: ", e)


'''
#Implement client here
#_tfidf = models.TfidfModel(corpus);
print _con.database_names()
sims = index[_tfidf[]]
'''

if __name__ == '__main__':
	'''
	corpus = [[(0, 1.0), (1, 1.0), (2, 1.0)],
	[(2, 1.0), (3, 1.0), (4, 1.0), (5, 1.0), (6, 1.0), (8, 1.0)],
	[(1, 1.0), (3, 1.0), (4, 1.0), (7, 1.0)],
	[(0, 1.0), (4, 2.0), (7, 1.0)],
	[(3, 1.0), (5, 1.0), (6, 1.0)],
	[(9, 1.0)],
	[(9, 1.0), (10, 1.0)],
	[(9, 1.0), (10, 1.0), (11, 1.0)],
	[(8, 1.0), (10, 1.0), (11, 1.0)]]

	#Read all things from the database and put them into corpus


	tfidf = models.TfidfModel(corpus)
	vec = [(0, 1), (4, 1)]
	print(tfidf[vec])
	
	index = similarities.SparseMatrixSimilarity(tfidf[corpus], num_features=12)
	sims = index[tfidf[vec]]

	print sims
	print(list(enumerate(sims)))
	'''
	
	server = MyTCPServer(('127.0.0.1', 6969), MyTCPServerHandler)
	server.serve_forever()

	