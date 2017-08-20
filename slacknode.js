/*
* Deploy me to webtask.io slack hook & Install node modules (from dependencies).
* 
* Slash Webtasks: Extend Slack with Node.js, powered by Auth0 Webtasks (https://webtask.io)
* For documentation, go to https://github.com/auth0/slash
* You can find us on Slack at https://webtask.slack.com (join via http://chat.webtask.io)
*
* TIPS:
* 1. Input and output: https://github.com/auth0/slash#inputs-and-outputs
* 2. Response formatting: https://api.slack.com/docs/messages/builder
* 3. Secrets you configure using the key icon are available on `ctx.secrets`
*
* Anyone can run slack hook: `/wt acl add user npm *`
* To revoke permission: run `/wt acl rm user npm *`
*/
const nodeFetch = require('node-fetch');

const shortenString = (text, max) => (text.length <= max ? text : text.substring(0, max) + '...');

const SHOW_COUNT = 8;

const searchNpm = keyword => nodeFetch(`https://api.npms.io/v2/search?q=${keyword}`).then(res => res.json());

module.exports = (ctx, cb) => {
  const keyword = ctx.body.text;
  const repos = searchNpm(keyword).then(json => {
    const repos = json.results
      .slice(0, SHOW_COUNT)
      .map(item => {
        const packg = item.package;
        const description = shortenString(packg.description, 30);
        const date = new Date(packg.date).toLocaleDateString();
        const link = packg.links.homepage || packg.links.repository || packg.links.npm;
        const author = packg.publisher.username;
        const authorLink = `https://www.npmjs.com/~${author}`;
        return `\`<${link}|${packg.name}>:${packg.version}\` by *<${authorLink}|${author}>* ${description} _(Updated \`${date})\`_`;
      })
      .join('\n');
    const notShownCount = json.total - Math.min(json.results.length, SHOW_COUNT);
    cb(null, {
      response_type: 'in_channel',
      text:
        `@${ctx.body.user_name} searched on npm with keyword '${keyword}':\n ${repos}` +
        (notShownCount > 0 ? `\nAnd ${notShownCount} more...` : '')
    });
  });
};
