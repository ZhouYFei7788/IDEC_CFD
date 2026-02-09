// Vue 应用逻辑
const { createApp } = Vue;

createApp({
    data() {
        return {
            meta: {
                location: "Shanxi, China"
            },
            header: {
                logo: "<HVAC_Eng />",
                links: [
                    { text: "项目", href: "#projects" },
                    { text: "博客", href: "#blog" },
                    { text: "工具箱", href: "#tools" },
                    { text: "在校经历", href: "#education" }
                ]
            },
            hero: {
                badge: "Testing & Commissioning Engineer",
                titleHtml: `个人<span class='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300'>技术博客</span><br>数据中心项目`,
                description: `参与了多个数据中心基础设施测试。从大同火山云到中联数据，<br>。`,
                buttonText: "查看交付项目"
            },
            footer: {
                copyright: "&copy; 2025 HVAC Engineer Portfolio.",
                locations: "Datong • Yanggao • China"
            },

            // --- 项目区域 ---
            projects: [
                {
                    id: 1,
                    type: "project",
                    span: 2,
                    isExpanded: false,
                    showFullDocument: false,
                    tags: { category: "Hyperscale", label: "D6, D8, D9, D10楼" },
                    title: "大同广灵火山云 · 太行算力中心",
                    summary: "参与了四栋大规模机楼的暖通系统的测试交付。完成了数千千瓦级的 IT 假负载验证，验证了大同低温气候自然冷却逻辑。",
                    techStack: ["机组逻辑验证", "机组功能测试", "PUE 优化"],
                    details: [
                        { label: "多栋集群交付", text: "统筹 D6-D10 四栋机房的暖通设备单机调试 (Start-up) 与联合调试 (IST)。" },
                        { label: "极限压力测试", text: "执行 12h/24h 连续温升测试，在满载工况下验证精密空调的制冷响应速度与热点消除能力。" },
                        { label: "自然冷源优化", text: "调整板换模式切入参数，在室外温度 <5℃ 时实现冷机完全停机，显著降低 PUE。" },
                        { label: "逻辑纠偏", text: "通过 PID 参数整定，解决了 D9 栋过渡季节加湿/除湿逻辑对抗导致的能耗浪费问题。" }
                    ]
                },

                // 2. 中联数据项目
                {
                    id: 2,
                    type: "project",
                    span: 1,
                    isExpanded: false,
                    showFullDocument: false,
                    tags: { category: "High Density", label: "Building 10-B" },
                    title: "阳高中联数据集团",
                    summary: "负责 10 号楼 B 区的高密机房测试。重点攻克蓄冷罐在双路断电下的应急切换测试。",
                    techStack: ["气流组织", "应急演练"],
                    details: [
                        { label: "应急冷源验证", text: "实测蓄冷罐在双路市电中断后的放冷曲线，确保冷机重启前温升 <2℃/min。" },
                        { label: "气流组织优化", text: "结合 CFD 仿真与现场手持风速仪数据，调整地板出风口开度，消除局部热点。" },
                        { label: "LOD 销项", text: "输出完整的测试问题清单并跟踪整改闭环。" }
                    ]
                }
            ],

            // --- 博客区域 ---
            blogs: [
                {
                    id: 101,
                    type: "blog",
                    span: 1,
                    isExpanded: false,
                    showFullDocument: false,
                    tags: { category: "Theory", label: "P-h Diagram" },
                    title: "压焓图在数据中心的应用",
                    summary: "基于 R410A 真实场景，利用压焓图分析制冷循环性能，通过过热度与过冷度的精确计算进行故障定位。",
                    techStack: ["故障诊断", "能效评估", "热力学"],
                    details: [
                        { label: "核心指标", text: "设定过热度 8-12K、过冷度 3-8K 为安全运行基准，防止液击或效率降低。" },
                        { label: "故障定位", text: "通过吸气/冷凝压力与温度对比，快速识别回液风险（过热度<2K）与冷凝不足问题。" },
                        { label: "能效优化", text: "分析冷凝压力偏高场景（如52℃），提出提升外风机转速、清洗翅片等优化策略。" }
                    ],
                    fullDocument: `
                        <h2>压焓图在数据中心暖通系统中的应用</h2>
                        
                        <h3>一、引言</h3>
                        <p>压焓图（P-h Diagram）是分析制冷循环性能的核心工具。在数据中心暖通系统中，通过压焓图可以直观地分析制冷剂的循环过程，诊断系统故障，并优化能效表现。本文基于 R410A 制冷剂的真实应用场景，深入探讨压焓图在数据中心暖通系统中的应用方法。</p>
                        
                        <h3>二、压焓图基础理论</h3>
                        <p>压焓图以压力（P）为纵坐标，比焓（h）为横坐标，完整描述了制冷剂在不同状态下的热力学性质。图中包含以下关键区域：</p>
                        <ul>
                            <li><strong>饱和液体线</strong>：左侧边界，表示饱和液体状态</li>
                            <li><strong>饱和蒸汽线</strong>：右侧边界，表示饱和蒸汽状态</li>
                            <li><strong>两相区</strong>：两线之间的区域，制冷剂处于气液混合状态</li>
                            <li><strong>等温线</strong>：水平线，表示等温过程</li>
                            <li><strong>等熵线</strong>：垂直线，表示等熵过程</li>
                        </ul>
                        
                        <h3>三、核心运行指标</h3>
                        <h4>3.1 过热度（Superheat）</h4>
                        <p>过热度是指压缩机吸气温度与对应压力下饱和温度的差值。在数据中心暖通系统中，设定过热度为 8-12K 是安全运行的关键基准：</p>
                        <ul>
                            <li><strong>过热度过低（&lt;2K）</strong>：存在回液风险，可能导致压缩机液击，严重损坏设备</li>
                            <li><strong>过热度过高（&gt;15K）</strong>：制冷效率降低，压缩机排气温度升高，影响系统寿命</li>
                            <li><strong>理想范围（8-12K）</strong>：既能防止回液，又能保证较高的制冷效率</li>
                        </ul>
                        
                        <h4>3.2 过冷度（Subcooling）</h4>
                        <p>过冷度是指冷凝器出口温度与对应压力下饱和温度的差值。设定过冷度为 3-8K 为最佳运行区间：</p>
                        <ul>
                            <li><strong>过冷度不足</strong>：可能导致膨胀阀前出现闪发，影响制冷量</li>
                            <li><strong>过冷度适中（3-8K）</strong>：提高制冷效率，减少膨胀阀前闪发</li>
                        </ul>
                        
                        <h3>四、故障诊断应用</h3>
                        <h4>4.1 回液风险识别</h4>
                        <p>通过对比吸气压力与吸气温度，在压焓图上定位运行点。当过热度低于 2K 时，运行点接近饱和液体线，存在严重的回液风险。此时需要：</p>
                        <ul>
                            <li>检查膨胀阀开度是否过大</li>
                            <li>验证蒸发器负荷是否匹配</li>
                            <li>排查制冷剂充注量是否过多</li>
                        </ul>
                        
                        <h4>4.2 冷凝不足问题诊断</h4>
                        <p>当冷凝压力正常但冷凝温度偏高时，在压焓图上表现为冷凝过程线向右偏移。常见原因包括：</p>
                        <ul>
                            <li>冷凝器翅片脏堵，换热效率下降</li>
                            <li>外风机转速不足，风量不够</li>
                            <li>环境温度过高，散热条件差</li>
                        </ul>
                        
                        <h3>五、能效优化策略</h3>
                        <h4>5.1 冷凝压力优化</h4>
                        <p>在冷凝压力偏高的场景（如冷凝温度达到 52℃），通过压焓图分析可以采取以下优化策略：</p>
                        <ul>
                            <li><strong>提升外风机转速</strong>：增加冷凝器风量，提高换热效率，降低冷凝压力</li>
                            <li><strong>清洗冷凝器翅片</strong>：清除灰尘和污垢，恢复换热性能</li>
                            <li><strong>优化冷凝器布局</strong>：改善通风条件，避免热风回流</li>
                        </ul>
                        
                        <h4>5.2 运行参数调整</h4>
                        <p>基于压焓图分析，可以精确调整以下运行参数：</p>
                        <ul>
                            <li>膨胀阀开度：控制过热度在理想范围</li>
                            <li>冷凝风机转速：维持合适的冷凝压力</li>
                            <li>制冷剂充注量：确保系统在最佳工况运行</li>
                        </ul>
                        
                        <h3>六、实际应用案例</h3>
                        <p>在某数据中心项目中，通过压焓图分析发现系统过热度仅为 3K，存在回液风险。经过检查发现膨胀阀开度过大，调整后过热度提升至 10K，系统运行稳定，制冷效率提升约 8%。</p>
                        
                        <h3>七、总结</h3>
                        <p>压焓图是数据中心暖通系统故障诊断和能效优化的有力工具。通过掌握过热度、过冷度等核心指标，结合压焓图分析，可以快速定位系统问题，优化运行参数，提升系统能效和可靠性。</p>
                    `
                },

                {
                    id: 102,
                    type: "blog",
                    span: 1,
                    isExpanded: false,
                    showFullDocument: false,
                    tags: { category: "Project Review", label: "IDEC, D10" },
                    title: "D10 暖通测试实战复盘",
                    summary: "针对 IDEC 机组在 D10 项目中的实战复盘，涵盖负压问题、冷媒填充、管路漏水及传感器故障的深度排查。",
                    techStack: ["IDEC", "故障排查", "现场整改"],
                    details: [
                        { label: "负压治理", text: "发现外风机转速过快导致冷凝仓检修门被吹起，引发机房负压，通过调整风机策略解决。" },
                        { label: "压缩机异常", text: "排查出因冷媒未填充到位，导致 EEV 开度高且过热度依然很高的异常工况。" },
                        { label: "管路隐患", text: "发现冷凝水排水口弯折导致冬季无法排水，加装泄水口防止存水湾负压异常。" }
                    ],
                    fullDocument: `
                        <h2>D10 暖通测试实战复盘</h2>
                        
                        <h3>一、项目背景</h3>
                        <p>D10 项目是大同火山云数据中心的重要组成部分，采用 IDEC（间接蒸发冷却）机组作为主要制冷设备。在测试交付过程中，遇到了多个技术难题，本文对这些问题进行深度复盘，总结故障排查思路和解决方案。</p>
                        
                        <h3>二、主要问题及解决方案</h3>
                        
                        <h4>2.1 负压问题治理</h4>
                        <h5>问题现象</h5>
                        <p>在系统运行过程中，发现机房出现负压现象，导致外门难以打开，影响正常运维。通过压力测试发现，机房负压达到 -15Pa，超出设计允许范围。</p>
                        
                        <h5>问题分析</h5>
                        <p>经过现场排查，发现问题的根本原因是：</p>
                        <ul>
                            <li>IDEC 机组外风机转速设置过高，导致排风量过大</li>
                            <li>冷凝仓检修门密封不严，在强风作用下被吹起</li>
                            <li>新风系统补风量不足，无法平衡排风量</li>
                        </ul>
                        
                        <h5>解决方案</h5>
                        <ul>
                            <li><strong>调整风机策略</strong>：根据室外温度动态调整外风机转速，在低温工况下降低转速，减少排风量</li>
                            <li><strong>加强密封</strong>：对冷凝仓检修门进行密封改造，增加密封条，防止漏风</li>
                            <li><strong>优化新风系统</strong>：增加新风补风量，确保机房压力平衡</li>
                        </ul>
                        
                        <h5>效果验证</h5>
                        <p>整改后，机房压力稳定在 ±5Pa 范围内，符合设计要求，问题得到彻底解决。</p>
                        
                        <h4>2.2 压缩机异常工况排查</h4>
                        <h5>问题现象</h5>
                        <p>在系统调试过程中，发现某台 IDEC 机组出现异常工况：</p>
                        <ul>
                            <li>EEV（电子膨胀阀）开度达到 85%，明显偏高</li>
                            <li>吸气过热度达到 18K，超出正常范围（8-12K）</li>
                            <li>制冷效果不佳，机房温度持续上升</li>
                        </ul>
                        
                        <h5>问题分析</h5>
                        <p>通过系统检查和分析，发现问题根源：</p>
                        <ul>
                            <li><strong>冷媒充注不足</strong>：系统冷媒充注量仅为设计值的 60%，导致制冷剂循环量不足</li>
                            <li><strong>EEV 开度补偿</strong>：系统检测到制冷量不足，自动增大 EEV 开度，但冷媒总量不足，无法改善工况</li>
                            <li><strong>过热度异常</strong>：由于冷媒不足，蒸发器出口制冷剂过热，导致过热度偏高</li>
                        </ul>
                        
                        <h5>解决方案</h5>
                        <ul>
                            <li><strong>补充冷媒</strong>：按照设计值补充 R410A 制冷剂，确保充注量达到 100%</li>
                            <li><strong>重新调试</strong>：补充冷媒后，重新调试 EEV 开度和过热度参数</li>
                            <li><strong>验证效果</strong>：系统运行稳定后，EEV 开度降至 45%，过热度稳定在 10K，制冷效果恢复正常</li>
                        </ul>
                        
                        <h4>2.3 冷凝水排水管路隐患</h4>
                        <h5>问题发现</h5>
                        <p>在冬季测试过程中，发现冷凝水排水不畅，部分机组出现冷凝水溢出问题。</p>
                        
                        <h5>问题分析</h5>
                        <p>经过现场检查，发现以下问题：</p>
                        <ul>
                            <li><strong>排水口弯折</strong>：冷凝水排水管在安装过程中出现弯折，导致排水不畅</li>
                            <li><strong>存水湾设计不当</strong>：存水湾高度过高，在冬季低温条件下，冷凝水容易结冰堵塞</li>
                            <li><strong>缺少泄水口</strong>：排水系统缺少泄水口，无法在紧急情况下快速排水</li>
                        </ul>
                        
                        <h5>解决方案</h5>
                        <ul>
                            <li><strong>整改排水管路</strong>：重新敷设排水管，消除弯折，确保排水顺畅</li>
                            <li><strong>优化存水湾</strong>：降低存水湾高度，增加保温措施，防止冬季结冰</li>
                            <li><strong>加装泄水口</strong>：在排水系统关键位置加装泄水口，便于紧急排水和维护</li>
                        </ul>
                        
                        <h4>2.4 传感器故障排查</h4>
                        <h5>问题现象</h5>
                        <p>系统运行过程中，BMS 系统显示部分温度传感器读数异常，出现跳变或固定值。</p>
                        
                        <h5>问题分析</h5>
                        <p>通过检查发现：</p>
                        <ul>
                            <li>传感器接线松动，导致信号不稳定</li>
                            <li>部分传感器安装位置不当，受热源影响</li>
                            <li>传感器校准参数错误，导致读数偏差</li>
                        </ul>
                        
                        <h5>解决方案</h5>
                        <ul>
                            <li>重新紧固所有传感器接线，确保连接可靠</li>
                            <li>调整传感器安装位置，避开热源和气流死角</li>
                            <li>重新校准传感器，确保读数准确</li>
                        </ul>
                        
                        <h3>三、经验总结</h3>
                        <h4>3.1 测试前准备</h4>
                        <ul>
                            <li>充分了解设备技术参数和运行逻辑</li>
                            <li>制定详细的测试方案和应急预案</li>
                            <li>准备必要的测试工具和备件</li>
                        </ul>
                        
                        <h4>3.2 问题排查思路</h4>
                        <ul>
                            <li>从现象入手，逐步深入分析根本原因</li>
                            <li>结合系统原理和实际工况，综合判断</li>
                            <li>利用测试数据验证问题分析和解决方案</li>
                        </ul>
                        
                        <h4>3.3 整改验证</h4>
                        <ul>
                            <li>整改后必须进行充分验证，确保问题彻底解决</li>
                            <li>记录整改过程和效果，形成知识积累</li>
                            <li>总结经验和教训，避免类似问题再次发生</li>
                        </ul>
                        
                        <h3>四、结论</h3>
                        <p>D10 项目的暖通测试过程虽然遇到了多个技术难题，但通过系统性的问题分析和针对性的解决方案，所有问题都得到了有效解决。这次实战经验为后续类似项目提供了宝贵的参考，也提升了团队的技术能力和问题处理能力。</p>
                    `
                },

                {
                    id: 103,
                    type: "blog",
                    span: 1, // 改为1，让第一行可以显示3个
                    isExpanded: false,
                    showFullDocument: false,
                    tags: { category: "Theory", label: "System Arch" },
                    title: "暖通系统架构与逆卡诺循环",
                    summary: "基于间接蒸发冷架构，深度解析数据中心暖通系统的宏观组成（空调、新风、水处理）与微观热力学循环原理。",
                    techStack: ["逆卡诺循环", "间接蒸发冷", "水处理工艺"],
                    details: [
                        { label: "宏观架构", text: "详解机房核心冷却、新风交换、恒湿及 RO 水处理系统的协同工作逻辑。" },
                        { label: "循环解析", text: "剖析压缩机、冷凝器、膨胀阀、蒸发器在实际工况下的能量转换，如膨胀阀开度对过热度的影响。" },
                        { label: "故障映射", text: "分析蒸发器脏堵导致吸气过热度变低、排气温度变高的热力学原因。" }
                    ],
                    fullDocument: `
                        <h2>暖通系统架构与逆卡诺循环</h2>
                        
                        <h3>一、系统概述</h3>
                        <p>数据中心暖通系统是保障 IT 设备稳定运行的关键基础设施。本文基于间接蒸发冷却（IDEC）架构，从宏观系统组成和微观热力学循环两个维度，深入解析数据中心暖通系统的工作原理。</p>
                        
                        <h3>二、宏观系统架构</h3>
                        <h4>2.1 机房核心冷却系统</h4>
                        <p>机房核心冷却系统是暖通系统的主体，主要包括：</p>
                        <ul>
                            <li><strong>精密空调机组</strong>：负责机房内的温度控制，通过制冷循环带走 IT 设备产生的热量</li>
                            <li><strong>送风系统</strong>：通过地板送风或顶部送风，将冷空气均匀分配到机房各个区域</li>
                            <li><strong>回风系统</strong>：收集热空气，形成完整的空气循环</li>
                            <li><strong>气流组织</strong>：通过合理的送风、回风布局，避免冷热空气混合，提高制冷效率</li>
                        </ul>
                        
                        <h4>2.2 新风交换系统</h4>
                        <p>新风系统的主要功能包括：</p>
                        <ul>
                            <li><strong>压力平衡</strong>：通过新风补风，维持机房正压，防止外部灰尘和湿气进入</li>
                            <li><strong>空气质量</strong>：引入新鲜空气，改善机房空气质量</li>
                            <li><strong>湿度控制</strong>：通过新风预处理，控制机房湿度在合理范围</li>
                        </ul>
                        
                        <h4>2.3 恒湿系统</h4>
                        <p>恒湿系统确保机房湿度稳定在 40%-60% RH 范围内：</p>
                        <ul>
                            <li><strong>加湿系统</strong>：在干燥季节，通过加湿器增加机房湿度</li>
                            <li><strong>除湿系统</strong>：在潮湿季节，通过除湿机降低机房湿度</li>
                            <li><strong>湿度传感器</strong>：实时监测机房湿度，自动调节加湿/除湿设备</li>
                        </ul>
                        
                        <h4>2.4 RO 水处理系统</h4>
                        <p>RO（反渗透）水处理系统为加湿系统提供纯净水：</p>
                        <ul>
                            <li><strong>预处理</strong>：去除原水中的悬浮物和杂质</li>
                            <li><strong>反渗透</strong>：通过 RO 膜去除溶解性盐类和有机物</li>
                            <li><strong>后处理</strong>：进一步净化，确保水质符合加湿要求</li>
                        </ul>
                        
                        <h3>三、系统协同工作逻辑</h3>
                        <p>各子系统通过 BMS（楼宇管理系统）实现协同工作：</p>
                        <ul>
                            <li><strong>温度控制</strong>：精密空调根据机房温度自动调节制冷量</li>
                            <li><strong>湿度控制</strong>：恒湿系统根据湿度传感器数据，自动启动加湿或除湿</li>
                            <li><strong>压力控制</strong>：新风系统根据机房压力自动调节补风量</li>
                            <li><strong>联动控制</strong>：各系统相互协调，确保机房环境参数稳定</li>
                        </ul>
                        
                        <h3>四、微观热力学循环——逆卡诺循环</h3>
                        <h4>4.1 逆卡诺循环原理</h4>
                        <p>逆卡诺循环是制冷系统的基本热力学循环，包括四个主要过程：</p>
                        <ol>
                            <li><strong>等熵压缩</strong>：压缩机对制冷剂进行绝热压缩，提高压力和温度</li>
                            <li><strong>等压冷凝</strong>：高温高压制冷剂在冷凝器中放热，冷凝成液体</li>
                            <li><strong>等熵膨胀</strong>：膨胀阀对制冷剂进行节流，降低压力和温度</li>
                            <li><strong>等压蒸发</strong>：低温低压制冷剂在蒸发器中吸热，蒸发成气体</li>
                        </ol>
                        
                        <h4>4.2 关键组件能量转换</h4>
                        <h5>压缩机</h5>
                        <p>压缩机是系统的"心脏"，通过消耗电能，将低温低压的制冷剂压缩成高温高压状态。压缩过程遵循等熵过程，理想情况下熵值不变。</p>
                        
                        <h5>冷凝器</h5>
                        <p>冷凝器是系统的"散热器"，高温高压的制冷剂在此处向环境放热，冷凝成液体。冷凝过程是等压过程，压力保持不变，温度逐渐降低。</p>
                        
                        <h5>膨胀阀</h5>
                        <p>膨胀阀（如 EEV 电子膨胀阀）控制制冷剂流量，通过节流作用降低压力和温度。膨胀阀开度直接影响：</p>
                        <ul>
                            <li><strong>制冷剂流量</strong>：开度越大，流量越大</li>
                            <li><strong>过热度</strong>：开度过大，过热度降低；开度过小，过热度升高</li>
                            <li><strong>制冷量</strong>：通过调节开度，控制系统的制冷量</li>
                        </ul>
                        
                        <h5>蒸发器</h5>
                        <p>蒸发器是系统的"吸热器"，低温低压的制冷剂在此处从机房环境吸热，蒸发成气体。蒸发过程是等压过程，压力保持不变，温度逐渐升高。</p>
                        
                        <h4>4.3 实际工况下的能量转换</h4>
                        <p>在实际运行中，各组件的工作状态会相互影响：</p>
                        <ul>
                            <li><strong>膨胀阀开度对过热度的影响</strong>：当膨胀阀开度增大时，制冷剂流量增加，蒸发器出口过热度降低；反之，开度减小时，过热度升高</li>
                            <li><strong>冷凝温度对系统性能的影响</strong>：冷凝温度升高，系统 COP（性能系数）降低，能耗增加</li>
                            <li><strong>蒸发温度对制冷量的影响</strong>：蒸发温度升高，制冷量增加，但 COP 降低</li>
                        </ul>
                        
                        <h3>五、故障热力学分析</h3>
                        <h4>5.1 蒸发器脏堵故障</h4>
                        <p>当蒸发器翅片脏堵时，会出现以下热力学现象：</p>
                        <ul>
                            <li><strong>换热效率降低</strong>：翅片脏堵导致传热系数下降，制冷剂无法充分吸热</li>
                            <li><strong>吸气过热度降低</strong>：由于换热不足，蒸发器出口制冷剂温度降低，过热度变小</li>
                            <li><strong>排气温度升高</strong>：压缩机吸气温度降低，但压缩比不变，导致排气温度相对升高</li>
                            <li><strong>制冷量下降</strong>：系统制冷量明显降低，机房温度上升</li>
                        </ul>
                        
                        <h4>5.2 冷凝器脏堵故障</h4>
                        <p>当冷凝器翅片脏堵时，会出现以下现象：</p>
                        <ul>
                            <li><strong>冷凝压力升高</strong>：换热效率降低，制冷剂无法充分放热，冷凝压力上升</li>
                            <li><strong>压缩比增大</strong>：冷凝压力升高导致压缩比增大，压缩机功耗增加</li>
                            <li><strong>系统 COP 降低</strong>：能耗增加，系统效率下降</li>
                        </ul>
                        
                        <h3>六、系统优化方向</h3>
                        <ul>
                            <li><strong>提高换热效率</strong>：定期清洗蒸发器和冷凝器翅片，保持良好换热性能</li>
                            <li><strong>优化运行参数</strong>：根据实际工况，调整膨胀阀开度、风机转速等参数</li>
                            <li><strong>改善气流组织</strong>：优化送风、回风布局，减少冷热空气混合</li>
                            <li><strong>利用自然冷源</strong>：在低温季节，充分利用自然冷源，降低系统能耗</li>
                        </ul>
                        
                        <h3>七、总结</h3>
                        <p>数据中心暖通系统是一个复杂的系统工程，需要从宏观架构和微观循环两个维度进行深入理解。只有掌握了系统的工作原理和热力学规律，才能更好地进行系统设计、调试和优化，确保数据中心的高效稳定运行。</p>
                    `
                },

            ],

            // --- 工具箱区域 ---
            tools: [
                {
                    id: 3,
                    type: "skill",
                    span: 1,
                    title: "测试与验证 (Cx)",
                    icon: "ri-thermometer-line",
                    colorClass: "text-blue-500",
                    list: [
                        "单机性能测试 (Start-up)",
                        "100% 假负载满载测试",
                        "热成像温度场扫描",
                        "BA 自控逻辑 PID 整定"
                    ]
                },
                {
                    id: 4,
                    type: "tools",
                    span: 1,
                    title: "工具软件",
                    icon: "ri-tools-line",
                    colorClass: "text-purple-500",
                    tags: ["AutoCAD", "CFD 仿真", "Fluke 热像仪", "BMS 系统", "压焓图分析"]
                },
                {
                    id: 5,
                    type: "quote",
                    span: 2,
                    title: "关于我的工作哲学",
                    icon: "ri-server-line",
                    text: `"交付不是结束，而是稳定运行的开始。" <br>在极端气候下验证系统的鲁棒性，确保每一瓦特电力都转化为有效算力，这就是暖通测试工程师的使命。`
                }
            ],

            // 在校经历数据
            education: {
                title: "在校经历",
                achievements: [
                    {
                        id: 1,
                        title: "人工智能比赛",
                        award: "第一名",
                        description: "在校期间参与人工智能比赛，获得第一名优异成绩",
                        icon: "ri-trophy-line",
                        colorClass: "text-yellow-500",
                        year: "在校期间"
                    },
                    {
                        id: 2,
                        title: "国家三等奖",
                        description: "在国家级竞赛中获得三等奖荣誉",
                        icon: "ri-award-line",
                        colorClass: "text-blue-500",
                        year: "在校期间"
                    },
                    {
                        id: 3,
                        title: "国家助学金",
                        description: "获得国家助学金资助",
                        icon: "ri-graduation-cap-line",
                        colorClass: "text-green-500",
                        year: "在校期间"
                    }
                ]
            }
        }
    },
    methods: {
        toggleExpand(item) {
            // 如果正在显示完整文档，先关闭完整文档
            if (item.showFullDocument) {
                item.showFullDocument = false;
                item.isExpanded = false;
            } else {
                item.isExpanded = !item.isExpanded;
            }
        },
        // 切换完整文档显示
        toggleFullDocument(item) {
            if (item.fullDocument) {
                // 切换当前博客，允许同时打开多个文档
                item.showFullDocument = !item.showFullDocument;
                // 如果展开完整文档，确保摘要也展开
                if (item.showFullDocument) {
                    item.isExpanded = true;
                    // 平滑滚动到展开的博客位置
                    this.$nextTick(() => {
                        const element = document.querySelector(`article[data-blog-id="${item.id}"]`);
                        if (element) {
                            const offset = 100; // 考虑固定头部的高度
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    });
                }
            }
        },
        // 获取所有项目（用于统一渲染）
        getAllItems() {
            return [...this.projects, ...this.blogs, ...this.tools];
        },
        // 动态获取标签颜色
        getTagColor(category) {
            if (category === 'Hyperscale') return 'text-blue-400 border-blue-900/30 bg-blue-900/10';
            if (category === 'High Density') return 'text-green-400 border-green-900/30 bg-green-900/10';
            if (category === 'Theory') return 'text-purple-400 border-purple-900/30 bg-purple-900/10'; // 理论类紫色
            if (category === 'Project Review') return 'text-orange-400 border-orange-900/30 bg-orange-900/10'; // 复盘类橙色
            return 'text-zinc-400 border-zinc-800 bg-zinc-800/50';
        }
    }
}).mount('#app');

