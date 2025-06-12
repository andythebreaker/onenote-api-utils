function processTopicJson(topicJson) {
    topicJson.forEach((topic) => {
      // Recursively process docTree
      function processDocTree(tree) {
        if (Array.isArray(tree)) {
          tree.forEach(processDocTree);
        } else if (tree && typeof tree === 'object') {
          if (tree.DOMinnerHtml) {
            // Encode DOMinnerHtml in Base64
            tree.DOMinnerHtml = Buffer.from(tree.DOMinnerHtml).toString('base64');
          }
          if (tree.DOMinnerText) {
            // Replace '\n' with '\\n', '\t' with '\\t', '\"' with '\\"' in DOMinnerText
            tree.DOMinnerText = tree.DOMinnerText.replace(/\n/g, '\\n');
            tree.DOMinnerText = tree.DOMinnerText.replace(/\t/g, '\\t');
            tree.DOMinnerText = tree.DOMinnerText.replace(/\"/g, '\\"');
          }
          if (tree.DOMfirstChildInnerText) {
            delete tree.DOMfirstChildInnerText;
          }
          if (tree.DOMchildArray) {
            processDocTree(tree.DOMchildArray);
          }
        }
      }
  
      let docTree = topic.docTree;
      processDocTree(docTree);
      topic.docTree = JSON.stringify(docTree, null, 2);
  
      topic.tables = topic.tables.map((table) => {
        // Encode table in Base64
        return Buffer.from(table).toString('base64');
      });
  
    });
    return topicJson;
}

export default processTopicJson;