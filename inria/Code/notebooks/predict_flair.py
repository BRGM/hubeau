import warnings
warnings.filterwarnings("ignore")
from flair.data import Sentence
from segtok.segmenter import split_single


# stop logging, prints, and warning from appearing on console
# sys.stdout = open(os.devnull, 'w')
# logger = logging.getLogger('flair')
# logger.propagate = False
# logger.disabled = True


def get_entities(snippets, model, tag_type, batch_size):
    """get_entities will run Flair and returning the entities in all the snippets
    snippets is a list of lists of size 2 of the form [node_id, snippet]"""
    sentences, id2sentences = get_tokenized_sentences(snippets)
    model.predict(sentences, mini_batch_size=batch_size)

    # We group the prediction such that they correspond to the input snippets
    # and also we adjust the start and end position of the entities to correspond to their position in the snippet
    # and not in the splitted sentences
    output = {"snippets": []}
    index_snippet = 0
    snippet = {"text": snippets[index_snippet][1], "entities": []}
    index_sentence = 0 # length of sentences of the snippet we have already processed
    for i in range(len(sentences)):
        if snippets[index_snippet][0] != id2sentences[i]: # we moved to another snippet
            output["snippets"].append((snippets[index_snippet][0], snippet))
            index_snippet += 1
            index_sentence = 0
            snippet = {"text": snippets[index_snippet][1], "entities": []}

        tagged_sentence = sentences[i].to_dict(tag_type=tag_type)
        #  a tagged entity is represented as a dictionary of this form
        #  {"confidence":0.9999816417694092,"end_pos":5,"start_pos":0,"text":"Paris","type":"LOC"}
        entities = tagged_sentence["entities"]
        for entity in entities:
            start_pos = index_sentence + entity["start_pos"]
            end_pos = start_pos + len(entity["text"])
            new_entity = entity
            new_entity["start_pos"] = start_pos
            new_entity["end_pos"] = end_pos
            snippet["entities"].append(new_entity)

        index_sentence += len(tagged_sentence["text"])

    output["snippets"].append((snippets[index_snippet][0], snippet))

    return output


def get_tokenized_sentences(snippets):
    """get_tokenized_sentences will first split the snippets in sentences"""
    sentences = []
    id2sentences = []
    for snippet in snippets:
        snippet_sent = split_single(snippet[1])
        id2sentences.extend([snippet[0]] * len(snippet_sent))
        sentences.extend(snippet_sent)

    return [Sentence(sentence, use_tokenizer=True) for sentence in sentences], id2sentences

