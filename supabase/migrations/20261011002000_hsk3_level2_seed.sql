-- Generado por npm run build:hsk-seed desde contenido/hsk3-level2.json.
-- Importa las entradas introducidas en HSK 3.0 nivel 2. Pinyin y
-- categoría crean sentidos provisionales; traducciones y ejemplos se curan después.

create temporary table hsk_source_entries_temp (
    source_order integer,
    hanzi text,
    source_label text,
    source_level_label text,
    pinyin text,
    pinyin_plain text,
    part_of_speech text
  ) on commit drop;

insert into hsk_source_entries_temp
select *
from jsonb_to_recordset($catalog$[{"source_order":301,"hanzi":"啊","source_label":"啊","source_level_label":"2","pinyin":"a","pinyin_plain":"a","part_of_speech":"助"},{"source_order":302,"hanzi":"爱好","source_label":"爱好","source_level_label":"2","pinyin":"àihào","pinyin_plain":"aihao","part_of_speech":"动、名"},{"source_order":303,"hanzi":"白色","source_label":"白色","source_level_label":"2","pinyin":"báisè","pinyin_plain":"baise","part_of_speech":"名"},{"source_order":304,"hanzi":"班","source_label":"班","source_level_label":"2（5）","pinyin":"bān","pinyin_plain":"ban","part_of_speech":"名、（量）"},{"source_order":305,"hanzi":"帮","source_label":"帮","source_level_label":"2","pinyin":"bāng","pinyin_plain":"bang","part_of_speech":"动"},{"source_order":306,"hanzi":"帮忙","source_label":"帮忙","source_level_label":"2","pinyin":"bāngmáng","pinyin_plain":"bangmang","part_of_speech":"动"},{"source_order":307,"hanzi":"包","source_label":"包","source_level_label":"2","pinyin":"bāo","pinyin_plain":"bao","part_of_speech":"动、名、量"},{"source_order":308,"hanzi":"本子","source_label":"本子","source_level_label":"2","pinyin":"běnzi","pinyin_plain":"benzi","part_of_speech":"名"},{"source_order":309,"hanzi":"比","source_label":"比","source_level_label":"2","pinyin":"bǐ","pinyin_plain":"bi","part_of_speech":"动、介"},{"source_order":310,"hanzi":"笔","source_label":"笔","source_level_label":"2（5）","pinyin":"bǐ","pinyin_plain":"bi","part_of_speech":"名、（量）"},{"source_order":311,"hanzi":"别","source_label":"别1","source_level_label":"2","pinyin":"bié","pinyin_plain":"bie","part_of_speech":"副"},{"source_order":312,"hanzi":"不错","source_label":"不错","source_level_label":"2","pinyin":"búcuò","pinyin_plain":"bucuo","part_of_speech":"形"},{"source_order":313,"hanzi":"不好意思","source_label":"不好意思","source_level_label":"2","pinyin":"bù hǎoyìsi","pinyin_plain":"buhaoyisi","part_of_speech":null},{"source_order":314,"hanzi":"长","source_label":"长","source_level_label":"2","pinyin":"cháng","pinyin_plain":"chang","part_of_speech":"形"},{"source_order":315,"hanzi":"车站","source_label":"车站","source_level_label":"2","pinyin":"chēzhàn","pinyin_plain":"chezhan","part_of_speech":"名"},{"source_order":316,"hanzi":"出","source_label":"出","source_level_label":"2","pinyin":"chū","pinyin_plain":"chu","part_of_speech":"动"},{"source_order":317,"hanzi":"出国","source_label":"出国","source_level_label":"2","pinyin":"chūguó","pinyin_plain":"chuguo","part_of_speech":"动"},{"source_order":318,"hanzi":"出来","source_label":"出来","source_level_label":"2","pinyin":"chūlái","pinyin_plain":"chulai","part_of_speech":"动"},{"source_order":319,"hanzi":"出门","source_label":"出门","source_level_label":"2","pinyin":"chūmén","pinyin_plain":"chumen","part_of_speech":"动"},{"source_order":320,"hanzi":"出去","source_label":"出去","source_level_label":"2","pinyin":"chūqù","pinyin_plain":"chuqu","part_of_speech":"动"},{"source_order":321,"hanzi":"床","source_label":"床","source_level_label":"2","pinyin":"chuáng","pinyin_plain":"chuang","part_of_speech":"名"},{"source_order":322,"hanzi":"词","source_label":"词","source_level_label":"2","pinyin":"cí","pinyin_plain":"ci","part_of_speech":"名"},{"source_order":323,"hanzi":"次","source_label":"次","source_level_label":"2（7-9）","pinyin":"cì","pinyin_plain":"ci","part_of_speech":"量、（形）"},{"source_order":324,"hanzi":"从","source_label":"从","source_level_label":"2（4）","pinyin":"cóng","pinyin_plain":"cong","part_of_speech":"介、（副）"},{"source_order":325,"hanzi":"从小","source_label":"从小","source_level_label":"2","pinyin":"cóngxiǎo","pinyin_plain":"congxiao","part_of_speech":"副"},{"source_order":326,"hanzi":"错","source_label":"错","source_level_label":"2","pinyin":"cuò","pinyin_plain":"cuo","part_of_speech":"形"},{"source_order":327,"hanzi":"打","source_label":"打1","source_level_label":"2","pinyin":"dǎ","pinyin_plain":"da","part_of_speech":"动"},{"source_order":328,"hanzi":"打车","source_label":"打车","source_level_label":"2","pinyin":"dǎchē","pinyin_plain":"dache","part_of_speech":"动"},{"source_order":329,"hanzi":"打开","source_label":"打开","source_level_label":"2","pinyin":"dǎkāi","pinyin_plain":"dakai","part_of_speech":"动"},{"source_order":330,"hanzi":"但","source_label":"但","source_level_label":"2（7-9）","pinyin":"dàn","pinyin_plain":"dan","part_of_speech":"连、（副）"},{"source_order":331,"hanzi":"但是","source_label":"但是","source_level_label":"2","pinyin":"dànshì","pinyin_plain":"danshi","part_of_speech":"连"},{"source_order":332,"hanzi":"得","source_label":"得","source_level_label":"2","pinyin":"de","pinyin_plain":"de","part_of_speech":"助"},{"source_order":333,"hanzi":"地","source_label":"地","source_level_label":"2","pinyin":"de","pinyin_plain":"de","part_of_speech":"助"},{"source_order":334,"hanzi":"等","source_label":"等1","source_level_label":"2（4）","pinyin":"děng","pinyin_plain":"deng","part_of_speech":"动、（介）"},{"source_order":335,"hanzi":"地铁","source_label":"地铁","source_level_label":"2","pinyin":"dìtiě","pinyin_plain":"ditie","part_of_speech":"名"},{"source_order":336,"hanzi":"点","source_label":"点2","source_level_label":"2（4）","pinyin":"diǎn","pinyin_plain":"dian","part_of_speech":"动、（名、量）"},{"source_order":337,"hanzi":"懂","source_label":"懂","source_level_label":"2","pinyin":"dǒng","pinyin_plain":"dong","part_of_speech":"动"},{"source_order":338,"hanzi":"动","source_label":"动","source_level_label":"2","pinyin":"dòng","pinyin_plain":"dong","part_of_speech":"动"},{"source_order":339,"hanzi":"饭馆","source_label":"饭馆","source_level_label":"2","pinyin":"fànguǎn","pinyin_plain":"fanguan","part_of_speech":"名"},{"source_order":340,"hanzi":"飞","source_label":"飞","source_level_label":"2","pinyin":"fēi","pinyin_plain":"fei","part_of_speech":"动"},{"source_order":341,"hanzi":"高","source_label":"高","source_level_label":"2","pinyin":"gāo","pinyin_plain":"gao","part_of_speech":"形、名"},{"source_order":342,"hanzi":"高中","source_label":"高中","source_level_label":"2","pinyin":"gāozhōng","pinyin_plain":"gaozhong","part_of_speech":"名"},{"source_order":343,"hanzi":"告诉","source_label":"告诉","source_level_label":"2","pinyin":"gàosu","pinyin_plain":"gaosu","part_of_speech":"动"},{"source_order":344,"hanzi":"个子","source_label":"个子","source_level_label":"2","pinyin":"gèzi","pinyin_plain":"gezi","part_of_speech":"名"},{"source_order":345,"hanzi":"跟","source_label":"跟","source_level_label":"2（5）","pinyin":"gēn","pinyin_plain":"gen","part_of_speech":"介、连、（名、动）"},{"source_order":346,"hanzi":"公交车","source_label":"公交车","source_level_label":"2","pinyin":"gōngjiāochē","pinyin_plain":"gongjiaoche","part_of_speech":"名"},{"source_order":347,"hanzi":"过","source_label":"过","source_level_label":"2","pinyin":"guò","pinyin_plain":"guo","part_of_speech":"动"},{"source_order":348,"hanzi":"过来","source_label":"过来","source_level_label":"2","pinyin":"guòlái","pinyin_plain":"guolai","part_of_speech":"动"},{"source_order":349,"hanzi":"过年","source_label":"过年","source_level_label":"2","pinyin":"guònián","pinyin_plain":"guonian","part_of_speech":"动"},{"source_order":350,"hanzi":"过去","source_label":"过去1","source_level_label":"2","pinyin":"guòqù","pinyin_plain":"guoqu","part_of_speech":"动"},{"source_order":351,"hanzi":"过","source_label":"过","source_level_label":"2","pinyin":"guo","pinyin_plain":"guo","part_of_speech":"助"},{"source_order":352,"hanzi":"还是","source_label":"还是","source_level_label":"2","pinyin":"háishi","pinyin_plain":"haishi","part_of_speech":"副、连"},{"source_order":353,"hanzi":"黑色","source_label":"黑色","source_level_label":"2","pinyin":"hēisè","pinyin_plain":"heise","part_of_speech":"名"},{"source_order":354,"hanzi":"红茶","source_label":"红茶","source_level_label":"2","pinyin":"hóngchá","pinyin_plain":"hongcha","part_of_speech":"名"},{"source_order":355,"hanzi":"红色","source_label":"红色","source_level_label":"2","pinyin":"hóngsè","pinyin_plain":"hongse","part_of_speech":"名"},{"source_order":356,"hanzi":"后面","source_label":"后面","source_level_label":"2","pinyin":"hòumiàn","pinyin_plain":"houmian","part_of_speech":"名"},{"source_order":357,"hanzi":"花","source_label":"花1","source_level_label":"2","pinyin":"huā","pinyin_plain":"hua","part_of_speech":"动"},{"source_order":358,"hanzi":"花","source_label":"花2","source_level_label":"2（6）","pinyin":"huā","pinyin_plain":"hua","part_of_speech":"名、（形）"},{"source_order":359,"hanzi":"画","source_label":"画","source_level_label":"2","pinyin":"huà","pinyin_plain":"hua","part_of_speech":"动、名"},{"source_order":360,"hanzi":"坏","source_label":"坏","source_level_label":"2","pinyin":"huài","pinyin_plain":"huai","part_of_speech":"形"},{"source_order":361,"hanzi":"回来","source_label":"回来","source_level_label":"2","pinyin":"huílái","pinyin_plain":"huilai","part_of_speech":"动"},{"source_order":362,"hanzi":"回去","source_label":"回去","source_level_label":"2","pinyin":"huíqù","pinyin_plain":"huiqu","part_of_speech":"动"},{"source_order":363,"hanzi":"机场","source_label":"机场","source_level_label":"2","pinyin":"jīchǎng","pinyin_plain":"jichang","part_of_speech":"名"},{"source_order":364,"hanzi":"机票","source_label":"机票","source_level_label":"2","pinyin":"jīpiào","pinyin_plain":"jipiao","part_of_speech":"名"},{"source_order":365,"hanzi":"记得","source_label":"记得","source_level_label":"2","pinyin":"jìde","pinyin_plain":"jide","part_of_speech":"动"},{"source_order":366,"hanzi":"间","source_label":"间","source_level_label":"2（4）","pinyin":"jiān","pinyin_plain":"jian","part_of_speech":"量、（名）"},{"source_order":367,"hanzi":"教","source_label":"教","source_level_label":"2","pinyin":"jiāo","pinyin_plain":"jiao","part_of_speech":"动"},{"source_order":368,"hanzi":"教室","source_label":"教室","source_level_label":"2","pinyin":"jiàoshì","pinyin_plain":"jiaoshi","part_of_speech":"名"},{"source_order":369,"hanzi":"介绍","source_label":"介绍","source_level_label":"2","pinyin":"jièshào","pinyin_plain":"jieshao","part_of_speech":"动"},{"source_order":370,"hanzi":"进","source_label":"进","source_level_label":"2","pinyin":"jìn","pinyin_plain":"jin","part_of_speech":"动"},{"source_order":371,"hanzi":"近","source_label":"近","source_level_label":"2","pinyin":"jìn","pinyin_plain":"jin","part_of_speech":"形"},{"source_order":372,"hanzi":"进来","source_label":"进来","source_level_label":"2","pinyin":"jìnlái","pinyin_plain":"jinlai","part_of_speech":"动"},{"source_order":373,"hanzi":"进去","source_label":"进去","source_level_label":"2","pinyin":"jìnqù","pinyin_plain":"jinqu","part_of_speech":"动"},{"source_order":374,"hanzi":"经常","source_label":"经常","source_level_label":"2","pinyin":"jīngcháng","pinyin_plain":"jingchang","part_of_speech":"副"},{"source_order":375,"hanzi":"酒店","source_label":"酒店","source_level_label":"2","pinyin":"jiǔdiàn","pinyin_plain":"jiudian","part_of_speech":"名"},{"source_order":376,"hanzi":"就","source_label":"就","source_level_label":"2（7-9）","pinyin":"jiù","pinyin_plain":"jiu","part_of_speech":"副、（介）"},{"source_order":377,"hanzi":"咖啡","source_label":"咖啡","source_level_label":"2","pinyin":"kāfēi","pinyin_plain":"kafei","part_of_speech":"名"},{"source_order":378,"hanzi":"开始","source_label":"开始","source_level_label":"2","pinyin":"kāishǐ","pinyin_plain":"kaishi","part_of_speech":"动、名"},{"source_order":379,"hanzi":"开学","source_label":"开学","source_level_label":"2","pinyin":"kāixué","pinyin_plain":"kaixue","part_of_speech":"动"},{"source_order":380,"hanzi":"考","source_label":"考","source_level_label":"2","pinyin":"kǎo","pinyin_plain":"kao","part_of_speech":"动"},{"source_order":381,"hanzi":"考试","source_label":"考试","source_level_label":"2","pinyin":"kǎoshì","pinyin_plain":"kaoshi","part_of_speech":"动、名"},{"source_order":382,"hanzi":"可能","source_label":"可能","source_level_label":"2","pinyin":"kěnéng","pinyin_plain":"keneng","part_of_speech":"形、名、动"},{"source_order":383,"hanzi":"裤子","source_label":"裤子","source_level_label":"2","pinyin":"kùzi","pinyin_plain":"kuzi","part_of_speech":"名"},{"source_order":384,"hanzi":"快","source_label":"快","source_level_label":"2","pinyin":"kuài","pinyin_plain":"kuai","part_of_speech":"形、副"},{"source_order":385,"hanzi":"快乐","source_label":"快乐","source_level_label":"2","pinyin":"kuàilè","pinyin_plain":"kuaile","part_of_speech":"形"},{"source_order":386,"hanzi":"快要","source_label":"快要","source_level_label":"2","pinyin":"kuàiyào","pinyin_plain":"kuaiyao","part_of_speech":"副"},{"source_order":387,"hanzi":"篮球","source_label":"篮球","source_level_label":"2","pinyin":"lánqiú","pinyin_plain":"lanqiu","part_of_speech":"名"},{"source_order":388,"hanzi":"累","source_label":"累","source_level_label":"2","pinyin":"lèi","pinyin_plain":"lei","part_of_speech":"形、动"},{"source_order":389,"hanzi":"离","source_label":"离","source_level_label":"2","pinyin":"lí","pinyin_plain":"li","part_of_speech":"动"},{"source_order":390,"hanzi":"里面","source_label":"里面","source_level_label":"2","pinyin":"lǐmiàn","pinyin_plain":"limian","part_of_speech":"名"},{"source_order":391,"hanzi":"楼","source_label":"楼","source_level_label":"2","pinyin":"lóu","pinyin_plain":"lou","part_of_speech":"名"},{"source_order":392,"hanzi":"路","source_label":"路","source_level_label":"2","pinyin":"lù","pinyin_plain":"lu","part_of_speech":"名"},{"source_order":393,"hanzi":"路上","source_label":"路上","source_level_label":"2","pinyin":"lùshang","pinyin_plain":"lushang","part_of_speech":"名"},{"source_order":394,"hanzi":"旅游","source_label":"旅游","source_level_label":"2","pinyin":"lǚyóu","pinyin_plain":"luyou","part_of_speech":"动"},{"source_order":395,"hanzi":"绿茶","source_label":"绿茶","source_level_label":"2","pinyin":"lǜchá","pinyin_plain":"lucha","part_of_speech":"名"},{"source_order":396,"hanzi":"绿色","source_label":"绿色","source_level_label":"2（4）","pinyin":"lǜsè","pinyin_plain":"luse","part_of_speech":"名、（形）"},{"source_order":397,"hanzi":"慢","source_label":"慢","source_level_label":"2","pinyin":"màn","pinyin_plain":"man","part_of_speech":"形"},{"source_order":398,"hanzi":"没意思","source_label":"没意思","source_level_label":"2","pinyin":"méi yìsi","pinyin_plain":"meiyisi","part_of_speech":null},{"source_order":399,"hanzi":"每","source_label":"每","source_level_label":"2（4）","pinyin":"měi","pinyin_plain":"mei","part_of_speech":"代、（副）"},{"source_order":400,"hanzi":"门","source_label":"门","source_level_label":"2","pinyin":"mén","pinyin_plain":"men","part_of_speech":"名"},{"source_order":401,"hanzi":"门口","source_label":"门口","source_level_label":"2","pinyin":"ménkǒu","pinyin_plain":"menkou","part_of_speech":"名"},{"source_order":402,"hanzi":"门票","source_label":"门票","source_level_label":"2","pinyin":"ménpiào","pinyin_plain":"menpiao","part_of_speech":"名"},{"source_order":403,"hanzi":"面","source_label":"面1","source_level_label":"2（5）","pinyin":"miàn","pinyin_plain":"mian","part_of_speech":"后缀、（动、名、量）"},{"source_order":404,"hanzi":"名","source_label":"名","source_level_label":"2","pinyin":"míng","pinyin_plain":"ming","part_of_speech":"名、量"},{"source_order":405,"hanzi":"拿","source_label":"拿","source_level_label":"2","pinyin":"ná","pinyin_plain":"na","part_of_speech":"动"},{"source_order":406,"hanzi":"那么","source_label":"那么","source_level_label":"2","pinyin":"nàme","pinyin_plain":"name","part_of_speech":"代、连"},{"source_order":407,"hanzi":"那样","source_label":"那样","source_level_label":"2","pinyin":"nàyàng","pinyin_plain":"nayang","part_of_speech":"代"},{"source_order":408,"hanzi":"奶茶","source_label":"奶茶","source_level_label":"2","pinyin":"nǎichá","pinyin_plain":"naicha","part_of_speech":"名"},{"source_order":409,"hanzi":"奶奶","source_label":"奶奶","source_level_label":"2","pinyin":"nǎinai","pinyin_plain":"nainai","part_of_speech":"名"},{"source_order":410,"hanzi":"男孩儿","source_label":"男孩儿","source_level_label":"2","pinyin":"nánháir","pinyin_plain":"nanhair","part_of_speech":"名"},{"source_order":411,"hanzi":"鸟","source_label":"鸟","source_level_label":"2","pinyin":"niǎo","pinyin_plain":"niao","part_of_speech":"名"},{"source_order":412,"hanzi":"女孩儿","source_label":"女孩儿","source_level_label":"2","pinyin":"nǚháir","pinyin_plain":"nuhair","part_of_speech":"名"},{"source_order":413,"hanzi":"旁边","source_label":"旁边","source_level_label":"2","pinyin":"pángbiān","pinyin_plain":"pangbian","part_of_speech":"名"},{"source_order":414,"hanzi":"跑","source_label":"跑","source_level_label":"2","pinyin":"pǎo","pinyin_plain":"pao","part_of_speech":"动"},{"source_order":415,"hanzi":"跑步","source_label":"跑步","source_level_label":"2","pinyin":"pǎobù","pinyin_plain":"paobu","part_of_speech":"动"},{"source_order":416,"hanzi":"票","source_label":"票","source_level_label":"2","pinyin":"piào","pinyin_plain":"piao","part_of_speech":"名"},{"source_order":417,"hanzi":"妻子","source_label":"妻子","source_level_label":"2","pinyin":"qīzi","pinyin_plain":"qizi","part_of_speech":"名"},{"source_order":418,"hanzi":"起来","source_label":"起来","source_level_label":"2","pinyin":"qǐlái","pinyin_plain":"qilai","part_of_speech":"动"},{"source_order":419,"hanzi":"前面","source_label":"前面","source_level_label":"2","pinyin":"qiánmiàn","pinyin_plain":"qianmian","part_of_speech":"名"},{"source_order":420,"hanzi":"晴","source_label":"晴","source_level_label":"2","pinyin":"qíng","pinyin_plain":"qing","part_of_speech":"形"},{"source_order":421,"hanzi":"球","source_label":"球","source_level_label":"2","pinyin":"qiú","pinyin_plain":"qiu","part_of_speech":"名"},{"source_order":422,"hanzi":"让","source_label":"让","source_level_label":"2（4）","pinyin":"ràng","pinyin_plain":"rang","part_of_speech":"动、（介）"},{"source_order":423,"hanzi":"肉","source_label":"肉","source_level_label":"2","pinyin":"ròu","pinyin_plain":"rou","part_of_speech":"名"},{"source_order":424,"hanzi":"商场","source_label":"商场","source_level_label":"2","pinyin":"shāngchǎng","pinyin_plain":"shangchang","part_of_speech":"名"},{"source_order":425,"hanzi":"上来","source_label":"上来","source_level_label":"2","pinyin":"shànglái","pinyin_plain":"shanglai","part_of_speech":"动"},{"source_order":426,"hanzi":"上面","source_label":"上面","source_level_label":"2","pinyin":"shàngmiàn","pinyin_plain":"shangmian","part_of_speech":"名"},{"source_order":427,"hanzi":"上去","source_label":"上去","source_level_label":"2","pinyin":"shàngqù","pinyin_plain":"shangqu","part_of_speech":"动"},{"source_order":428,"hanzi":"上网","source_label":"上网","source_level_label":"2","pinyin":"shàngwǎng","pinyin_plain":"shangwang","part_of_speech":"动"},{"source_order":429,"hanzi":"身体","source_label":"身体","source_level_label":"2","pinyin":"shēntǐ","pinyin_plain":"shenti","part_of_speech":"名"},{"source_order":430,"hanzi":"生日","source_label":"生日","source_level_label":"2","pinyin":"shēngrì","pinyin_plain":"shengri","part_of_speech":"名"},{"source_order":431,"hanzi":"时","source_label":"时","source_level_label":"2（6）","pinyin":"shí","pinyin_plain":"shi","part_of_speech":"名、（量）"},{"source_order":432,"hanzi":"事情","source_label":"事情","source_level_label":"2","pinyin":"shìqing","pinyin_plain":"shiqing","part_of_speech":"名"},{"source_order":433,"hanzi":"手","source_label":"手","source_level_label":"2","pinyin":"shǒu","pinyin_plain":"shou","part_of_speech":"名"},{"source_order":434,"hanzi":"手表","source_label":"手表","source_level_label":"2","pinyin":"shǒubiǎo","pinyin_plain":"shoubiao","part_of_speech":"名"},{"source_order":435,"hanzi":"书包","source_label":"书包","source_level_label":"2","pinyin":"shūbāo","pinyin_plain":"shubao","part_of_speech":"名"},{"source_order":436,"hanzi":"舒服","source_label":"舒服","source_level_label":"2","pinyin":"shūfu","pinyin_plain":"shufu","part_of_speech":"形"},{"source_order":437,"hanzi":"送","source_label":"送","source_level_label":"2","pinyin":"sòng","pinyin_plain":"song","part_of_speech":"动"},{"source_order":438,"hanzi":"虽然","source_label":"虽然","source_level_label":"2","pinyin":"suīrán","pinyin_plain":"suiran","part_of_speech":"连"},{"source_order":439,"hanzi":"所以","source_label":"所以","source_level_label":"2","pinyin":"suǒyǐ","pinyin_plain":"suoyi","part_of_speech":"连"},{"source_order":440,"hanzi":"疼","source_label":"疼","source_level_label":"2（6）","pinyin":"téng","pinyin_plain":"teng","part_of_speech":"形、（动）"},{"source_order":441,"hanzi":"踢","source_label":"踢","source_level_label":"2","pinyin":"tī","pinyin_plain":"ti","part_of_speech":"动"},{"source_order":442,"hanzi":"题","source_label":"题","source_level_label":"2","pinyin":"tí","pinyin_plain":"ti","part_of_speech":"名"},{"source_order":443,"hanzi":"条","source_label":"条","source_level_label":"2（5）","pinyin":"tiáo","pinyin_plain":"tiao","part_of_speech":"量、（名）"},{"source_order":444,"hanzi":"跳舞","source_label":"跳舞","source_level_label":"2","pinyin":"tiàowǔ","pinyin_plain":"tiaowu","part_of_speech":"动"},{"source_order":445,"hanzi":"头","source_label":"头","source_level_label":"2（3）（5）","pinyin":"tóu","pinyin_plain":"tou","part_of_speech":"名、（量）、（形）"},{"source_order":446,"hanzi":"外国","source_label":"外国","source_level_label":"2","pinyin":"wàiguó","pinyin_plain":"waiguo","part_of_speech":"名"},{"source_order":447,"hanzi":"外面","source_label":"外面","source_level_label":"2","pinyin":"wàimiàn","pinyin_plain":"waimian","part_of_speech":"名"},{"source_order":448,"hanzi":"完","source_label":"完","source_level_label":"2","pinyin":"wán","pinyin_plain":"wan","part_of_speech":"动"},{"source_order":449,"hanzi":"万","source_label":"万","source_level_label":"2","pinyin":"wàn","pinyin_plain":"wan","part_of_speech":"数"},{"source_order":450,"hanzi":"往","source_label":"往","source_level_label":"2","pinyin":"wǎng","pinyin_plain":"wang","part_of_speech":"动、介"},{"source_order":451,"hanzi":"网上","source_label":"网上","source_level_label":"2","pinyin":"wǎngshang","pinyin_plain":"wangshang","part_of_speech":"名"},{"source_order":452,"hanzi":"忘","source_label":"忘","source_level_label":"2","pinyin":"wàng","pinyin_plain":"wang","part_of_speech":"动"},{"source_order":453,"hanzi":"位","source_label":"位","source_level_label":"2","pinyin":"wèi","pinyin_plain":"wei","part_of_speech":"量"},{"source_order":454,"hanzi":"为什么","source_label":"为什么","source_level_label":"2","pinyin":"wèi shénme","pinyin_plain":"weishenme","part_of_speech":null},{"source_order":455,"hanzi":"希望","source_label":"希望","source_level_label":"2","pinyin":"xīwàng","pinyin_plain":"xiwang","part_of_speech":"动"},{"source_order":456,"hanzi":"洗","source_label":"洗","source_level_label":"2","pinyin":"xǐ","pinyin_plain":"xi","part_of_speech":"动"},{"source_order":457,"hanzi":"洗手间","source_label":"洗手间","source_level_label":"2","pinyin":"xǐshǒujiān","pinyin_plain":"xishoujian","part_of_speech":"名"},{"source_order":458,"hanzi":"下来","source_label":"下来","source_level_label":"2","pinyin":"xiàlái","pinyin_plain":"xialai","part_of_speech":"动"},{"source_order":459,"hanzi":"下面","source_label":"下面","source_level_label":"2","pinyin":"xiàmiàn","pinyin_plain":"xiamian","part_of_speech":"名"},{"source_order":460,"hanzi":"下去","source_label":"下去","source_level_label":"2","pinyin":"xiàqù","pinyin_plain":"xiaqu","part_of_speech":"动"},{"source_order":461,"hanzi":"小孩儿","source_label":"小孩儿","source_level_label":"2","pinyin":"xiǎoháir","pinyin_plain":"xiaohair","part_of_speech":"名"},{"source_order":462,"hanzi":"小时候","source_label":"小时候","source_level_label":"2","pinyin":"xiǎoshíhou","pinyin_plain":"xiaoshihou","part_of_speech":"名"},{"source_order":463,"hanzi":"笑","source_label":"笑","source_level_label":"2","pinyin":"xiào","pinyin_plain":"xiao","part_of_speech":"动"},{"source_order":464,"hanzi":"姓","source_label":"姓","source_level_label":"2","pinyin":"xìng","pinyin_plain":"xing","part_of_speech":"名、动"},{"source_order":465,"hanzi":"姓名","source_label":"姓名","source_level_label":"2","pinyin":"xìngmíng","pinyin_plain":"xingming","part_of_speech":"名"},{"source_order":466,"hanzi":"颜色","source_label":"颜色","source_level_label":"2","pinyin":"yánsè","pinyin_plain":"yanse","part_of_speech":"名"},{"source_order":467,"hanzi":"眼睛","source_label":"眼睛","source_level_label":"2","pinyin":"yǎnjing","pinyin_plain":"yanjing","part_of_speech":"名"},{"source_order":468,"hanzi":"药","source_label":"药","source_level_label":"2","pinyin":"yào","pinyin_plain":"yao","part_of_speech":"名"},{"source_order":469,"hanzi":"药店","source_label":"药店","source_level_label":"2","pinyin":"yàodiàn","pinyin_plain":"yaodian","part_of_speech":"名"},{"source_order":470,"hanzi":"爷爷","source_label":"爷爷","source_level_label":"2","pinyin":"yéye","pinyin_plain":"yeye","part_of_speech":"名"},{"source_order":471,"hanzi":"一会儿","source_label":"一会儿","source_level_label":"2（3）","pinyin":"yíhuìr","pinyin_plain":"yihuir","part_of_speech":"数量、（副）"},{"source_order":472,"hanzi":"已经","source_label":"已经","source_level_label":"2","pinyin":"yǐjīng","pinyin_plain":"yijing","part_of_speech":"副"},{"source_order":473,"hanzi":"一起","source_label":"一起","source_level_label":"2","pinyin":"yìqǐ","pinyin_plain":"yiqi","part_of_speech":"副"},{"source_order":474,"hanzi":"意思","source_label":"意思","source_level_label":"2","pinyin":"yìsi","pinyin_plain":"yisi","part_of_speech":"名"},{"source_order":475,"hanzi":"阴","source_label":"阴","source_level_label":"2","pinyin":"yīn","pinyin_plain":"yin","part_of_speech":"形"},{"source_order":476,"hanzi":"因为","source_label":"因为","source_level_label":"2","pinyin":"yīnwèi","pinyin_plain":"yinwei","part_of_speech":"介、连"},{"source_order":477,"hanzi":"游","source_label":"游","source_level_label":"2","pinyin":"yóu","pinyin_plain":"you","part_of_speech":"动"},{"source_order":478,"hanzi":"游泳","source_label":"游泳","source_level_label":"2","pinyin":"yóuyǒng","pinyin_plain":"youyong","part_of_speech":"动"},{"source_order":479,"hanzi":"有意思","source_label":"有意思","source_level_label":"2","pinyin":"yǒu yìsi","pinyin_plain":"youyisi","part_of_speech":null},{"source_order":480,"hanzi":"有时","source_label":"有时","source_level_label":"2","pinyin":"yǒushí","pinyin_plain":"youshi","part_of_speech":"副"},{"source_order":481,"hanzi":"右","source_label":"右","source_level_label":"2","pinyin":"yòu","pinyin_plain":"you","part_of_speech":"名"},{"source_order":482,"hanzi":"右边","source_label":"右边","source_level_label":"2","pinyin":"yòubian","pinyin_plain":"youbian","part_of_speech":"名"},{"source_order":483,"hanzi":"鱼","source_label":"鱼","source_level_label":"2","pinyin":"yú","pinyin_plain":"yu","part_of_speech":"名"},{"source_order":484,"hanzi":"远","source_label":"远","source_level_label":"2","pinyin":"yuǎn","pinyin_plain":"yuan","part_of_speech":"形"},{"source_order":485,"hanzi":"运动","source_label":"运动","source_level_label":"2","pinyin":"yùndòng","pinyin_plain":"yundong","part_of_speech":"动、名"},{"source_order":486,"hanzi":"站","source_label":"站1","source_level_label":"2","pinyin":"zhàn","pinyin_plain":"zhan","part_of_speech":"名"},{"source_order":487,"hanzi":"丈夫","source_label":"丈夫","source_level_label":"2","pinyin":"zhàngfu","pinyin_plain":"zhangfu","part_of_speech":"名"},{"source_order":488,"hanzi":"这么","source_label":"这么","source_level_label":"2","pinyin":"zhème","pinyin_plain":"zheme","part_of_speech":"代"},{"source_order":489,"hanzi":"这样","source_label":"这样","source_level_label":"2","pinyin":"zhèyàng","pinyin_plain":"zheyang","part_of_speech":"代"},{"source_order":490,"hanzi":"着","source_label":"着","source_level_label":"2","pinyin":"zhe","pinyin_plain":"zhe","part_of_speech":"助"},{"source_order":491,"hanzi":"正","source_label":"正","source_level_label":"2（5）","pinyin":"zhèng","pinyin_plain":"zheng","part_of_speech":"副、（形）"},{"source_order":492,"hanzi":"周","source_label":"周","source_level_label":"2（6）","pinyin":"zhōu","pinyin_plain":"zhou","part_of_speech":"名、（量）"},{"source_order":493,"hanzi":"准备","source_label":"准备","source_level_label":"2","pinyin":"zhǔnbèi","pinyin_plain":"zhunbei","part_of_speech":"动"},{"source_order":494,"hanzi":"自己","source_label":"自己","source_level_label":"2","pinyin":"zìjǐ","pinyin_plain":"ziji","part_of_speech":"代"},{"source_order":495,"hanzi":"走","source_label":"走","source_level_label":"2","pinyin":"zǒu","pinyin_plain":"zou","part_of_speech":"动"},{"source_order":496,"hanzi":"走路","source_label":"走路","source_level_label":"2","pinyin":"zǒulù","pinyin_plain":"zoulu","part_of_speech":"动"},{"source_order":497,"hanzi":"足球","source_label":"足球","source_level_label":"2","pinyin":"zúqiú","pinyin_plain":"zuqiu","part_of_speech":"名"},{"source_order":498,"hanzi":"最","source_label":"最","source_level_label":"2","pinyin":"zuì","pinyin_plain":"zui","part_of_speech":"副"},{"source_order":499,"hanzi":"左","source_label":"左","source_level_label":"2","pinyin":"zuǒ","pinyin_plain":"zuo","part_of_speech":"名"},{"source_order":500,"hanzi":"左边","source_label":"左边","source_level_label":"2","pinyin":"zuǒbian","pinyin_plain":"zuobian","part_of_speech":"名"}]$catalog$::jsonb) as entry (
  source_order integer,
  hanzi text,
  source_label text,
  source_level_label text,
  pinyin text,
  pinyin_plain text,
  part_of_speech text
);

insert into words (hanzi, hsk_level, hsk_version, origin, status)
select distinct hanzi, 2, '3.0', 'open_data'::content_origin, 'unreviewed'::review_status
from hsk_source_entries_temp
on conflict (hanzi) do nothing;

-- Vincula un sentido ya curado cuando hanzi+pinyin identifica una sola entrada
-- oficial. Si la fuente repite ambos, se mantienen borradores separados porque
-- representan usos distintos aunque se pronuncien igual (点1/点2, 花1/花2).
with matched_entries as (
  select
    words.id as word_id,
    source_entries.source_order,
    source_entries.pinyin,
    source_entries.pinyin_plain,
    source_entries.part_of_speech,
    count(*) over (
      partition by words.id, source_entries.pinyin
    ) as matching_entry_count
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
), reusable as (
  select
    matched_entries.*,
    matched_sense.id as sense_id
  from matched_entries
  left join lateral (
    select senses.id
    from senses
    where senses.word_id = matched_entries.word_id
      and senses.pinyin = matched_entries.pinyin
      and senses.catalog_source_id is null
    order by senses.position
    limit 1
  ) as matched_sense on true
  where matched_entries.matching_entry_count = 1
)
update senses
set
  catalog_source_id = 'cti-hsk3-2026',
  catalog_source_order = reusable.source_order,
  pinyin_plain = coalesce(senses.pinyin_plain, reusable.pinyin_plain)
from reusable
where senses.id = reusable.sense_id
  and reusable.sense_id is not null;

with candidates as (
  select
    words.id as word_id,
    source_entries.source_order,
    source_entries.pinyin,
    source_entries.pinyin_plain,
    source_entries.part_of_speech
  from hsk_source_entries_temp as source_entries
  join words using (hanzi)
  where not exists (
    select 1 from senses
    where senses.catalog_source_id = 'cti-hsk3-2026'
      and senses.catalog_source_order = source_entries.source_order
  )
), positioned as (
  select
    candidates.*,
    coalesce((
      select max(senses.position)
      from senses
      where senses.word_id = candidates.word_id
    ), 0) + row_number() over (
      partition by candidates.word_id order by candidates.source_order
    ) as position
  from candidates
)
insert into senses (
  word_id,
  position,
  pinyin,
  pinyin_plain,
  category,
  catalog_source_id,
  catalog_source_order,
  origin,
  status
)
select
  word_id,
  position,
  pinyin,
  pinyin_plain,
  part_of_speech,
  'cti-hsk3-2026',
  source_order,
  'open_data'::content_origin,
  'unreviewed'::review_status
from positioned
on conflict (word_id, position) do nothing;

-- Conserva cada entrada oficial. Un mismo hanzi puede reaparecer con otra
-- lectura o sentido en otro nivel (por ejemplo 点1/点2 o 只 zhī/zhǐ).
insert into word_levels (
  word_id,
  sense_id,
  standard,
  level,
  source_id,
  source_order,
  source_label,
  source_level_label,
  pinyin,
  part_of_speech
)
select
  words.id,
  matched_sense.id,
  'hsk-3.0',
  2,
  'cti-hsk3-2026',
  source_entries.source_order,
  source_entries.source_label,
  source_entries.source_level_label,
  source_entries.pinyin,
  source_entries.part_of_speech
from hsk_source_entries_temp as source_entries
join words using (hanzi)
left join lateral (
  select senses.id
  from senses
  where senses.catalog_source_id = 'cti-hsk3-2026'
    and senses.catalog_source_order = source_entries.source_order
  order by senses.position
  limit 1
) as matched_sense on true
on conflict (standard, source_order) do update set
  word_id = excluded.word_id,
  sense_id = excluded.sense_id,
  level = excluded.level,
  source_id = excluded.source_id,
  source_label = excluded.source_label,
  source_level_label = excluded.source_level_label,
  pinyin = excluded.pinyin,
  part_of_speech = excluded.part_of_speech;

drop table hsk_source_entries_temp;
