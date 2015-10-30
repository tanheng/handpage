### handpage与其说是一个轻量级的webapp框架，实际上更像是一种关于轻型手机端页面应用的开发理念。

#### 轻型手机端页面应用 -- light weight mobile webapp

全面O2O的催动下，应用进入快消时代。普罗大众除了作为各类应用的终端用户，也逐渐开始对“拥有”一个应用产生需求。可以是为自己的铺面做一个微店， 为自己组织的一项活动做一个报名传单，做一个电子请柬、一份简历站...  以前那种以专业化的软件团队耗时几个月以不菲的成本为企业级客户开发一个android/ios应用的模式，不再适用。
webapp，也就是基于页面开发的应用，天生具有易传播、易发布、跨平台、低成本的优势，几乎是解决上述需求的完美方案。三五屏简约漂亮的内容，几个简单的交互，通过微信/微博、朋友圈发布出去，一个人一杯下午茶的制作成本。

因此，所谓页面轻应用，指的是为**某一个单一需求而制作的，十几个场景以内的，具备简单数据交互/简单后台逻辑的，以前端界面设计为开发重心的应用**。




### webapp框架无数，为什么再造轮子？是为了满足 *简单* *灵活*的核心理念。


#### 有框架 vs 无框架
无论是angular、react，还是企业级的sencha、kendo... 甚至包括以易上手著称的jquery mobile，对开发人员来说，动辄都需要几个周的学习曲线。如果是做一个企业级的复杂app，其一次性的学习成本是值得的；但对于一个开发周期按小时计算的小应用，为了几k行的代码引入几w行的库，就有失轻重。况且框架换代出新的频率日增，其跟进成本越来越大。对于简单的页面应用，反倒不如回到原点，用大部分前端开发人员都熟悉的“原生”html/css/js，已经能够满足绝大部分目标，不须对开发人员的知识背景做任何假设。
handpage几乎是零框架，只有几个简单的约定和api，几十分钟的上手时间，剩下一切交给创意。



#### 有控件 vs 无控件
大型app中的控件，几行代码就可以完成非常复杂的交互，看起来很美。但问题是，只要是封装好的任何东西，其定制性、灵活性必然受损。很多框架的内置/扩展控件，具有很深的代码层级，做一点点界面微调往往都需要对整个框架极为深入的研究。而对于轻型页面应用，其UI界面灵动，强调创造性、针对性，交互点相对（企业级数据应用）较少，因此，我们不太建议在轻量级webapp中使用各类框架库的现成复杂控件，而是鼓励基于css/js为特定页面定制一些小而美的UI动效。



#### web vs app
web偏重于内容呈现，app偏重于数据交互，二者本质不同。最明显的，就是导航模式的不同：app是一个紧凑的整体，切换的单位是UI界面或场景；而web是基于url跳转来实现内容切换，其单位是一个个离散的、单独加载的页面。
各有优劣。app更紧凑，但代价是开发的时候要作为一个整体进行规划（MVC、routing...）；web页面离散加载会影响浏览的流畅感、用户需要做无谓等待，但可以一个个页面单独开发，解耦性高，轻巧灵活。
handpage不对应用采用哪种模式做任何假定，支持传统的基于url的导航，也鼓励做成SPA（single page application）。而且handpage尝试性地在两种模式之间做了一个平衡，支持一种“页面拼合”式的SPA开发模式：在不牺牲app场景切换流畅性的同时，又支持开发人员熟悉的页面单独开发。



#### 那后台呢？
不同于企业级应用中业务逻辑主要实现在服务器端，这种轻型页面应用的数据交互一般较为简单：下一个订单，发表一个评论，仅此而已。鉴于此，handpage没有采用php/python/ruby等后台语言，而是选用了nodejs -- 一种轻量级，而且最重要的，其语法是前端开发人员已经熟悉了的javascript作为后台数据交互语言。
除了不得不在后台实现的数据逻辑，建议开发人员将尽量多的业务逻辑实现在前端（如session、cache、validation、converting...），后台基本上仅实现简单的数据存取。当今每一台手机都拥有桌面级的计算硬件，好好利用它们。



#### 插件化替代框架化
handpage虽不提倡深层次、紧耦合的框架式体系，但仍然鼓励复用，鼓励将日常开发中常用到的一些功能、服务、接口、甚至部件萃取出来共享使用，简化开发。handpage尝试性地在实现一个扁平的插件集合，无论是微信接口等后台服务，还是一套漂亮的CSS样式、一个实用的动效，只要简单易用，我们就欢迎。